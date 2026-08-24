# Week 3 Task 1 — JWT Authentication

This project extends the Week 2 Task 4 Prisma e-commerce API with bcrypt password hashing and JWT authentication.

## Requirements implemented

- `POST /register` creates a user and hashes the password with bcrypt before storage.
- `POST /login` verifies the password and returns a signed JWT.
- The JWT secret is read from `JWT_SECRET`; it is not hardcoded.
- JWTs expire after `JWT_EXPIRES_IN` (one hour by default).
- Authentication middleware verifies Bearer tokens and sets `req.user`.
- Missing, malformed, invalid, and expired tokens receive HTTP `401`.
- Every user, product, order, and order-item endpoint requires authentication.
- Passwords and password hashes are excluded from API responses and request logs.

The health endpoint (`GET /`) and authentication endpoints are public. Business-data endpoints are protected.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database named `week3_task1_db`.

3. Copy `.env.example` to `.env` and provide real values:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week3_task1_db?schema=public"
   JWT_SECRET="a-long-random-secret-that-is-not-committed"
   JWT_EXPIRES_IN="1h"
   PORT=3000
   ```

   One way to generate a secret is `openssl rand -base64 48`.

4. Generate Prisma Client and apply the migrations:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   ```

5. Start the API:

   ```bash
   npm run dev
   ```

## Authentication workflow

Register:

```http
POST /register
Content-Type: application/json

{
  "name": "Vinit",
  "email": "vinit@example.com",
  "password": "strong-password",
  "phone": "9876543210",
  "address": "India"
}
```

Login:

```http
POST /login
Content-Type: application/json

{
  "email": "vinit@example.com",
  "password": "strong-password"
}
```

The login response contains `token` and the public user fields. Send that token with every protected request:

```http
GET /products
Authorization: Bearer YOUR_JWT_HERE
```

The verified identity is available to downstream handlers as `req.user`:

```js
{ id: 1, email: "vinit@example.com" }
```

## Endpoints

| Access | Method | Endpoint | Purpose |
|---|---|---|---|
| Public | `GET` | `/` | Health check |
| Public | `POST` | `/register` | Create an account |
| Public | `POST` | `/login` | Receive a JWT |
| Protected | CRUD | `/users`, `/users/:id` | Manage users |
| Protected | CRUD | `/products`, `/products/:id` | Manage products |
| Protected | CRUD | `/orders`, `/orders/:id` | Manage orders |
| Protected | CRUD | `/order-items`, `/order-items/:id` | Manage order items |

The protected `POST /users` route is retained from Week 2 for CRUD completeness. It also requires a password and hashes it with bcrypt. Normal account creation should use `/register`.

## Existing Week 2 databases

The password migration preserves existing user rows with a reset-required placeholder. Those legacy accounts cannot log in until a new bcrypt password is set. A fresh database does not require this extra step.

## Verification

```bash
npm test
npx prisma validate
```

The automated tests cover bcrypt hashing plus missing, valid, invalid, and expired JWT behavior.
