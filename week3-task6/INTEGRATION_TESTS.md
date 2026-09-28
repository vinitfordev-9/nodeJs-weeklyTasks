# Supertest integration-test report

## Result

- 63 Supertest tests pass.
- The integration command was run twice from a clean reset and produced the same 63/63 result both times.
- The complete `npm test` command passes 113/113 tests across nine suites.
- Supertest exercises the exported Express app without starting `server.js` or requiring a manually managed port.

## Test data isolation

The suite sets both `NODE_ENV=test` and `TEST_DATABASE_MODE=memory` before loading the application. It fails immediately if those guards are absent. Jest replaces only `config/prisma` with `test/helpers/testDatabase.js`; the Express application, middleware, routes, controllers, and service modules remain real.

The test adapter:

- lives only under `test/helpers`;
- starts from known users, products, orders, and order items;
- resets all tables and ID counters before every test;
- implements the Prisma operations and relation shapes used by the services;
- simulates unique, missing-record, and foreign-key errors;
- never reads `DATABASE_URL` and therefore cannot touch development or production records.

`.env.test.example` documents the separate test configuration. The high login limit prevents shared rate-limiter state from introducing order-dependent failures.

## Endpoint matrix

| Endpoint | Happy path | Error coverage |
|---|---|---|
| `GET /` | Health response and Helmet header | Rejected CORS origin (`403`) |
| `POST /register` | Sanitized `USER` registration | Invalid body (`400`) |
| `POST /login` | Signed JWT returned | Incorrect credentials (`401`) |
| `GET /users` | Admin receives public users | Missing token (`401`) |
| `GET /users/:id` | Existing user returned | Missing user (`404`), missing token (`401`) |
| `POST /users` | Admin creates user | Invalid body (`400`), missing token (`401`) |
| `PUT /users/:id` | Admin updates user | Missing user (`404`), missing token (`401`) |
| `DELETE /users/:id` | Admin deletes user | Missing user (`404`), missing token (`401`) |
| `GET /products` | Authenticated list | Missing token (`401`) |
| `GET /products/:id` | Existing product returned | Missing product (`404`), missing token (`401`) |
| `POST /products` | Admin creates product | Invalid body (`400`), wrong role (`403`), missing token (`401`) |
| `PUT /products/:id` | Admin updates product | Missing product (`404`), missing token (`401`) |
| `DELETE /products/:id` | Admin deletes product | Missing product (`404`), missing token (`401`) |
| `GET /orders` | Authenticated list | Missing token (`401`) |
| `GET /orders/:id` | Existing order returned | Missing order (`404`), missing token (`401`) |
| `POST /orders` | Valid order created | Missing related user (`400`), missing token (`401`) |
| `PUT /orders/:id` | Existing order updated | Missing order (`404`), missing token (`401`) |
| `DELETE /orders/:id` | Unreferenced order deleted | Missing order (`404`), missing token (`401`) |
| `GET /order-items` | Authenticated list | Missing token (`401`) |
| `GET /order-items/:id` | Existing item returned | Missing item (`404`), missing token (`401`) |
| `POST /order-items` | Valid item created | Missing related order (`400`), missing token (`401`) |
| `PUT /order-items/:id` | Existing item updated | Missing item (`404`), missing token (`401`) |
| `DELETE /order-items/:id` | Existing item deleted | Missing item (`404`), missing token (`401`) |

## Commands

```bash
# Unit and integration tests plus coverage
npm test

# Integration tests only
npm run test:integration
```
