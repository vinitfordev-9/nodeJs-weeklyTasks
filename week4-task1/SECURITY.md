# Security hardening and OWASP mapping

This task adds defense in depth around the existing bcrypt, JWT, and role-based access controls. These controls reduce risk; they do not replace secure deployment, monitoring, dependency updates, or HTTPS at the reverse proxy.

## A01:2021 — Broken Access Control

- JWT middleware rejects missing, invalid, and expired tokens before business routes run.
- Role middleware returns `403 Forbidden` when an authenticated `USER` attempts an `ADMIN` operation.
- User management plus product creation, update, and deletion are restricted to administrators.
- Public registration discards a supplied role, preventing an account from self-registering as an administrator.

## A03:2021 — Injection

- Joi schemas allowlist request fields and enforce their types and lengths.
- Prisma uses parameterized database operations rather than concatenated SQL.
- The sanitization middleware strips HTML tags, active event attributes, null bytes, and prototype-related object keys before validated values can reach stored fields.
- Passwords are excluded from transformation so a user's authentication secret is hashed and later compared exactly as supplied.

These measures address SQL-style injection, stored XSS payloads, and object/prototype manipulation at the input boundary. Output encoding is still required in any frontend based on its rendering context.

## A05:2021 — Security Misconfiguration

- Helmet sets secure HTTP response headers, including a restrictive referrer policy and cross-origin resource policy.
- CORS uses the explicit comma-separated `ALLOWED_ORIGINS` environment value. It does not reflect arbitrary origins and does not enable credentialed cross-origin requests.
- Request bodies are limited to 100 KB to reduce oversized-payload abuse.
- JWT secrets and allowed origins remain environment configuration rather than source-code constants.

## A07:2021 — Identification and Authentication Failures

- Passwords are hashed with bcrypt and never returned or logged in plaintext.
- Login issues signed, expiring JWTs using the configured secret.
- The login endpoint is limited to five attempts per 15-minute window by default, slowing password guessing and credential-stuffing attacks.
- Rate-limit values are configurable using `LOGIN_RATE_LIMIT` and `LOGIN_RATE_WINDOW_MS`.

## Deployment notes

- Terminate HTTPS in front of the API and do not serve authentication traffic over plaintext HTTP.
- Set `ALLOWED_ORIGINS` to exact production frontend origins; do not use `*`.
- Use a long, randomly generated `JWT_SECRET` and rotate it through the deployment secret manager.
- When running behind a trusted reverse proxy, configure Express proxy trust specifically for that topology so IP-based rate limiting sees the correct client address.
- Use a shared rate-limit store such as Redis when running multiple API instances; the default in-memory store is per-process.

## Dependency audit note

`npm audit fix` upgraded the vulnerable `brace-expansion` dependency to its patched release. The remaining audit finding is `deepmerge-ts` under the development-only Prisma CLI configuration package. npm currently proposes a breaking Prisma major-version downgrade as its only automatic fix, so it was not forced. The application runtime does not import that Prisma CLI path; monitor Prisma releases and update when a compatible patched version is available.
