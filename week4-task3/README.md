# Week 4 Task 3 — Live order notifications

Copied from Week 4 Task 2, retaining authentication, PostgreSQL/Prisma, Redis caching and BullMQ email jobs.

## Real-time feature

Run the setup below, start the API, then open **http://localhost:3000/live/** and log in with a registered account. Include that exact origin in `ALLOWED_ORIGINS`. Create or update an order through the existing authenticated API (or Postman); its owner immediately receives an `order:changed` notification without refreshing. Deletions also emit notifications.

- JWT authentication on every connection; the server derives `user:<id>` rooms from verified claims. Clients cannot choose rooms.
- Only the resulting order owner's tabs receive the event. Payloads contain order ID, action, status, total and timestamp, without user records.
- Visible connection state, automatic retries after transport loss, manual reconnect/disconnect and logout.
- Active sessions disconnect at JWT expiry. Logout/page exit releases socket and manager listeners; server disconnect clears the expiry timer and Socket.IO removes room membership.
- SIGINT/SIGTERM closes sockets before database/cache/queue connections.
- Notifications are ephemeral and are not replayed after disconnection. Reconnect does not duplicate listeners. This implementation uses one API process; multiple instances require a shared Socket.IO adapter.
- Existing REST authorization behavior is inherited from Task 2; this change scopes notification delivery, not the existing order endpoint permissions.

![Live Socket.IO demonstration](docs/realtime-demo.gif)

The GIF captures actual browser interactions and HTTP-triggered Socket.IO events against an **isolated in-memory database fixture**, not PostgreSQL. It shows login, order creation, shipping, disconnect, reconnect, delivery and logout. The recording script also checks that a different user's order produces no notification.

```bash
npm test
npm run demo:record
```

The recording requires Google Chrome installed locally. See [REALTIME.md](REALTIME.md) for event contracts and verification details.

## Background email queue

- Queue: `email-delivery`
- Job type: `send-confirmation-email`
- Producer: `controllers/authController.js`
- Consumer: `workers/emailWorker.js`
- Processor: `processors/emailProcessor.js`
- Retry policy: three total attempts (two retries) with exponential backoff starting at one second.
- Failed attempts are structured error logs containing job ID, request ID, attempt counts, and `willRetry`.
- The originating HTTP request ID is stored in job data and carried into worker logs.
- Queue failures do not roll back an already-created user; the response reports `confirmationQueued: false` and logs the enqueue error.

Run the API and worker as separate processes:

```bash
npm run dev
npm run worker:email
```

The included processor simulates an email-provider call with `EMAIL_DELIVERY_DELAY_MS`. Set `SIMULATE_EMAIL_FAILURE=true` on the worker to verify retry behavior. Replace the processor body with an SMTP or transactional-email provider call for real delivery; the queue, retry, and logging boundary stays unchanged.

See [BACKGROUND_JOBS.md](./BACKGROUND_JOBS.md) for the flow and live verification evidence.

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

2. Start Redis locally (or provide a managed Redis URL) and create a PostgreSQL database named `week4_task3_db`.

   ```bash
   redis-server
   ```

3. Copy `.env.example` to `.env` and replace the sample values:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week4_task3_db?schema=public"
   JWT_SECRET="a-long-random-secret-that-is-not-committed"
   JWT_EXPIRES_IN="1h"
   ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3001,http://localhost:3000"
   LOGIN_RATE_WINDOW_MS=900000
   LOGIN_RATE_LIMIT=5
   LOG_LEVEL=info
   REDIS_URL="redis://127.0.0.1:6379"
   REDIS_CACHE_ENABLED=true
   REDIS_CONNECT_TIMEOUT_MS=1000
   PRODUCTS_CACHE_TTL_SECONDS=60
   EMAIL_QUEUE_ENABLED=true
   BULLMQ_REDIS_URL="redis://127.0.0.1:6379"
   EMAIL_WORKER_CONCURRENCY=5
   EMAIL_DELIVERY_DELAY_MS=250
   SIMULATE_EMAIL_FAILURE=false
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

6. In a separate terminal, start the worker:

   ```bash
   npm run worker:email
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
