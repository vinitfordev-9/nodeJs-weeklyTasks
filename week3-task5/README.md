# Week 3 Task 5 — Supertest Integration Testing

This project extends Week 3 Task 4 with Supertest integration tests against the actual Express application. Routes, middleware, validation, controllers, services, authentication, authorization, security headers, CORS, and error handling execute normally. Only Prisma is replaced with an isolated in-memory test database adapter that resets before every test and cannot access production data.

## Test outcome

- 8 Jest suites
- 111 passing tests: 48 unit and 63 integration
- 100% statement coverage
- 100% function coverage
- 100% line coverage
- 96.47% branch coverage
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

2. Create a PostgreSQL database named `week3_task5_db`.

3. Copy `.env.example` to `.env` and replace the sample values:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week3_task5_db?schema=public"
   JWT_SECRET="a-long-random-secret-that-is-not-committed"
   JWT_EXPIRES_IN="1h"
   ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3001"
   LOGIN_RATE_WINDOW_MS=900000
   LOGIN_RATE_LIMIT=5
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
npx prisma validate
```

`npm test` runs both unit and integration suites. To run only the 63 Supertest cases:

```bash
npm run test:integration
```

Every protected endpoint is called both without authentication (`401`) and with a valid role-appropriate JWT. Every endpoint also has a happy-path assertion, while validation, authorization, CORS, invalid credentials, missing relations, and not-found resources supply realistic failure coverage.
