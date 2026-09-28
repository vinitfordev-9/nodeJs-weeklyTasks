# Week 4 Task 1 — Redis Product Caching

This project extends Week 3 Task 6 with Redis cache-aside caching in front of authenticated `GET /products`. A successful miss is cached for 60 seconds by default, and product or order-item writes invalidate the key immediately because order items are embedded in the product-list response. Redis failures fail open to PostgreSQL instead of taking down the API.

## Product cache

- `X-Cache: HIT` means Redis served the response.
- `X-Cache: MISS` means Redis was available but the database served and populated the response.
- `X-Cache: BYPASS` means caching is disabled or Redis is unavailable.
- `PRODUCTS_CACHE_TTL_SECONDS` controls the positive TTL; the default is 60 seconds.
- `POST`, `PUT`, and `DELETE` product operations invalidate `products:all:v1` after successful database writes.
- Order-item create, update, and delete operations also invalidate the key so embedded `orderItems` never wait for TTL expiry.

See [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md) for the reproducible 30-request before/after measurement. The measured full-response mean changed from **11.611 ms uncached** to **1.121 ms cached**, a **90.35% reduction** in the controlled local run.

## Logging

- Set `LOG_LEVEL` to `trace`, `debug`, `info`, `warn`, `error`, `fatal`, or `silent` (`info` is the default).
- Use `req.log.info({ key: value }, "Message")` in request handlers so the request ID is included automatically.
- Use the root logger from `config/logger.js` only for events that are not tied to an HTTP request.
- Sensitive authorization and cookie headers are redacted from logs.

Example output:

```json
{"level":30,"time":1760000000000,"requestId":"27cc24aa-7052-4de0-b91d-6727df829f0a","res":{"statusCode":200},"responseTimeMs":8,"msg":"GET /products completed"}
```

## Test outcome

- 11 Jest suites
- 123 passing tests: 60 unit and 63 integration
- 93% statement coverage
- 90.69% function coverage
- 93.26% line coverage
- 90.65% branch coverage
- A global 70% threshold is enforced in `jest.config.js`

Run the entire suite and regenerate every coverage format with one command:

```bash
npm test
```

Open `coverage/index.html` for the browsable report. See [COVERAGE.md](./COVERAGE.md) for scope and edge-case details.

See [INTEGRATION_TESTS.md](./INTEGRATION_TESTS.md) for the endpoint matrix, isolation strategy, and deterministic-run evidence.

## Security controls

- Helmet supplies secure response headers.
- CORS permits only exact origins listed in `ALLOWED_ORIGINS`.
- Login attempts are rate-limited to five per 15 minutes by default.
- JSON bodies are limited to 100 KB.
- Stored string fields have HTML, event-handler payloads, and null bytes removed.
- Prototype-related keys are discarded from nested request bodies.
- Password values bypass transformation and are hashed exactly as submitted.
- Joi allowlists fields and Prisma performs parameterized database operations.

See [SECURITY.md](./SECURITY.md) for the mapping to OWASP A01 Broken Access Control, A03 Injection, A05 Security Misconfiguration, and A07 Identification and Authentication Failures.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Redis locally (or provide a managed Redis URL) and create a PostgreSQL database named `week4_task1_db`.

   ```bash
   redis-server
   ```

3. Copy `.env.example` to `.env` and replace the sample values:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week4_task1_db?schema=public"
   JWT_SECRET="a-long-random-secret-that-is-not-committed"
   JWT_EXPIRES_IN="1h"
   ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3001"
   LOGIN_RATE_WINDOW_MS=900000
   LOGIN_RATE_LIMIT=5
   LOG_LEVEL=info
   REDIS_URL="redis://127.0.0.1:6379"
   REDIS_CACHE_ENABLED=true
   REDIS_CONNECT_TIMEOUT_MS=1000
   PRODUCTS_CACHE_TTL_SECONDS=60
   PORT=3000
   ```

   `ALLOWED_ORIGINS` is a comma-separated list of exact frontend origins. Leave out paths and trailing slashes. Browser origins not listed receive `403`. Requests without an `Origin` header, such as curl and server-to-server requests, remain allowed.

4. Generate Prisma Client and apply migrations:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   ```

5. Start the API:

   ```bash
   npm run dev
   ```

## Authentication and roles

Public endpoints:

- `GET /`
- `POST /register`
- `POST /login` — rate-limited

Every user, product, order, and order-item endpoint requires a valid Bearer JWT. All user-management operations and product creation, update, and deletion also require the `ADMIN` role.

To create the first administrator, register normally and then run locally:

```bash
npm run user:make-admin -- admin@example.com
```

Log in again after promotion to receive a token containing the new role.

## Example CORS request

An allowed frontend may log in with:

```http
POST /login
Origin: http://localhost:5173
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "strong-password"
}
```

An unlisted browser origin receives `403`. More than the configured number of login attempts from one client IP receives `429 Too Many Requests` until the window resets.

## Verification

```bash
npm test
npm run benchmark:cache
npx prisma validate
```

`npm test` runs both unit and integration suites. To run only the 63 Supertest cases:

```bash
npm run test:integration
```

Every protected endpoint is called both without authentication (`401`) and with a valid role-appropriate JWT. Every endpoint also has a happy-path assertion, while validation, authorization, CORS, invalid credentials, missing relations, and not-found resources supply realistic failure coverage.
