const { performance } = require("node:perf_hooks");
const jwt = require("jsonwebtoken");

const REQUESTS_PER_RUN = Number(process.env.BENCHMARK_REQUESTS) || 30;
const SIMULATED_DB_LATENCY_MS =
  Number(process.env.BENCHMARK_DB_LATENCY_MS) || 8;

function percentile(sortedValues, percentage) {
  const index = Math.ceil((percentage / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    requests: sorted.length,
    meanMs: Number((total / sorted.length).toFixed(3)),
    medianMs: Number(percentile(sorted, 50).toFixed(3)),
    p95Ms: Number(percentile(sorted, 95).toFixed(3)),
    minMs: Number(sorted[0].toFixed(3)),
    maxMs: Number(sorted.at(-1).toFixed(3)),
  };
}

async function main() {
  if (REQUESTS_PER_RUN < 20) {
    throw new Error("BENCHMARK_REQUESTS must be at least 20");
  }

  process.env.NODE_ENV = "benchmark";
  process.env.LOG_LEVEL = "silent";
  process.env.REDIS_CACHE_ENABLED = "true";
  process.env.JWT_SECRET = "cache-benchmark-secret";
  process.env.ALLOWED_ORIGINS = "";

  // Use the deterministic repository from the integration suite so this
  // benchmark never reads or mutates a developer or production database.
  const testDatabase = require("../test/helpers/testDatabase");
  testDatabase.reset("unused-benchmark-password-hash");

  const originalFindMany = testDatabase.prisma.product.findMany.bind(
    testDatabase.prisma.product,
  );
  testDatabase.prisma.product.findMany = async (...args) => {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DB_LATENCY_MS));
    return originalFindMany(...args);
  };

  const prismaPath = require.resolve("../config/prisma");
  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: testDatabase.prisma,
    children: [],
    paths: [],
  };

  const app = require("../app");
  const productCache = require("../services/productCache");
  const token = jwt.sign(
    { email: "user@example.com", role: "USER" },
    process.env.JWT_SECRET,
    { subject: "2", expiresIn: "5m" },
  );
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/products`;

  async function timedRequest(expectedCacheStatus) {
    const startedAt = performance.now();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`GET /products returned ${response.status}`);
    await response.arrayBuffer();
    const elapsed = performance.now() - startedAt;
    if (response.headers.get("x-cache") !== expectedCacheStatus) {
      throw new Error(
        `Expected X-Cache ${expectedCacheStatus}, got ${response.headers.get("x-cache")}`,
      );
    }
    return elapsed;
  }

  try {
    const uncached = [];
    for (let index = 0; index < REQUESTS_PER_RUN; index += 1) {
      await productCache.invalidateProducts();
      uncached.push(await timedRequest("MISS"));
    }

    await productCache.invalidateProducts();
    await timedRequest("MISS");

    const cached = [];
    for (let index = 0; index < REQUESTS_PER_RUN; index += 1) {
      cached.push(await timedRequest("HIT"));
    }

    const before = summarize(uncached);
    const after = summarize(cached);
    const improvementPercent = Number(
      (((before.meanMs - after.meanMs) / before.meanMs) * 100).toFixed(2),
    );

    process.stdout.write(
      `${JSON.stringify(
        {
          endpoint: "GET /products",
          redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
          simulatedDatabaseLatencyMs: SIMULATED_DB_LATENCY_MS,
          beforeUncached: before,
          afterCached: after,
          meanLatencyImprovementPercent: improvementPercent,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await productCache.close();
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err.message}\n`);
  process.exitCode = 1;
});
