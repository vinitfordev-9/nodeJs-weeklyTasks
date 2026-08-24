# Week 3 Task 2 — Role-Based Access Control

This project extends Week 3 Task 1 with role-based authorization. It retains bcrypt password hashing, JWT authentication, and the Prisma e-commerce API.

## Requirements implemented

- The Prisma `User` model has a `role` field backed by a `Role` enum.
- Supported roles are `USER` and `ADMIN`; new registrations default to `USER`.
- Login JWTs contain the signed user's ID, email, and role.
- Authentication middleware verifies the JWT and attaches those claims to `req.user`.
- Reusable role middleware checks the authenticated user's role.
- A missing or invalid token returns `401 Unauthorized`.
- An authenticated user with the wrong role returns `403 Forbidden`.
- Public registration strips any supplied `role`, preventing self-promotion.
- Passwords and password hashes are never returned by direct or nested API queries.

## Access policy

| Endpoint | `USER` | `ADMIN` |
|---|---:|---:|
| `GET /products` and `GET /products/:id` | Allowed | Allowed |
| `POST /products` | `403` | Allowed |
| `PUT /products/:id` | `403` | Allowed |
| `DELETE /products/:id` | `403` | Allowed |
| All `/users` CRUD endpoints | `403` | Allowed |
| Orders and order items | Allowed | Allowed |

All routes in this table first require a valid Bearer token. `GET /`, `POST /register`, and `POST /login` remain public.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database named `week3_task2_db`.

3. Copy `.env.example` to `.env` and set real values:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week3_task2_db?schema=public"
   JWT_SECRET="a-long-random-secret-that-is-not-committed"
   JWT_EXPIRES_IN="1h"
   PORT=3000
   ```

4. Generate Prisma Client and apply the migrations:

   ```bash
   npm run prisma:generate
   npx prisma migrate deploy
   ```

5. Start the API:

   ```bash
   npm run dev
   ```

## Create the first administrator

Registration deliberately creates only regular users. Register an account, then promote it locally through the provided script:

```bash
npm run user:make-admin -- admin@example.com
```

Log in again after promotion so the newly issued JWT contains the `ADMIN` role. Do not expose this local script as a public endpoint.

## Authentication workflow

Register a regular user:

```http
POST /register
Content-Type: application/json

{
  "name": "Vinit",
  "email": "vinit@example.com",
  "password": "strong-password"
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

Use the returned token:

```http
POST /products
Authorization: Bearer YOUR_ADMIN_JWT
Content-Type: application/json

{
  "productName": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard",
  "price": 1500,
  "stockQuantity": 25
}
```

## Verification

```bash
npm test
npx prisma validate
```

Tests cover bcrypt hashing, JWT validation, invalid and expired tokens, `ADMIN` access, `USER` rejection with `403`, and prevention of registration-based role escalation.
