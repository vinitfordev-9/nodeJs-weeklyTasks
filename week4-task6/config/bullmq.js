function getBullMqConnection() {
  const redisUrl = new URL(
    process.env.BULLMQ_REDIS_URL ||
      process.env.REDIS_URL ||
      "redis://127.0.0.1:6379",
  );
  const database = Number(redisUrl.pathname.slice(1) || 0);

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: Number.isInteger(database) ? database : 0,
    maxRetriesPerRequest: null,
    ...(redisUrl.protocol === "rediss:" ? { tls: {} } : {}),
  };
}

module.exports = { getBullMqConnection };
