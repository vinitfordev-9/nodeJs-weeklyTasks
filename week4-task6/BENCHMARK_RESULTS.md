# Redis cache benchmark results

## Result

On 31 August 2026, a local controlled run measured 30 uncached and 30 cached HTTP requests through the real authenticated `GET /products` Express route.

| Scenario | Requests | Mean | Median | p95 | Minimum | Maximum |
|---|---:|---:|---:|---:|---:|---:|
| Before: forced Redis miss | 30 | 11.611 ms | 10.494 ms | 12.369 ms | 9.819 ms | 40.125 ms |
| After: Redis hit | 30 | 1.121 ms | 1.000 ms | 2.868 ms | 0.600 ms | 3.411 ms |

The cached mean was **90.35% lower**. The median fell by **90.47%**, from 10.494 ms to 1.000 ms. The uncached maximum includes a 40.125 ms first-run outlier, so the median and p95 are included alongside the mean rather than hiding the distribution.

## Method

- Node.js 26.5.1 and Redis 8.10.1 ran locally on Apple Silicon.
- The script uses the actual Express app, JWT authentication, product route, cache middleware, JSON serialization, Redis TCP client, and HTTP response path.
- The isolated in-memory integration repository prevents the benchmark from reading or changing development or production data.
- An explicit 8 ms delay models a modest database round trip. This assumption is printed in the benchmark output and is not presented as a production PostgreSQL measurement.
- Before each uncached sample, the script deletes `products:all:v1` outside the timed interval and verifies `X-Cache: MISS`.
- Before cached samples, the script primes the key once, then verifies `X-Cache: HIT` for all 30 timed requests.
- Each timing ends only after the complete response body has been consumed.
- Requests run sequentially to compare single-request latency without concurrency effects.

These numbers demonstrate the cache-path impact in this controlled environment. Production results will depend on network placement, PostgreSQL load, response size, Redis topology, and request concurrency; run the same script in the target environment before making a capacity claim.

## Reproduce

Start Redis on `127.0.0.1:6379`, then run:

```bash
npm run benchmark:cache
```

Optional controls:

```bash
BENCHMARK_REQUESTS=50 BENCHMARK_DB_LATENCY_MS=12 npm run benchmark:cache
```

`BENCHMARK_REQUESTS` must be at least 20. `REDIS_URL` may point to a different Redis instance.
