# Week 2 Task 4 — Prisma E-commerce API

A REST API built with Node.js, Express, Prisma ORM, PostgreSQL, and Joi. It replaces the Week 1 in-memory data layer with persistent PostgreSQL storage accessed entirely through Prisma Client.

## Assignment requirements covered

- Prisma models match the Week 2.1 ER diagram.
- A Prisma migration is created and applied.
- CRUD operations use Prisma Client with no raw SQL.
- User, Order, Product, and OrderItem relations are queryable with `include` and `select`.
- Request bodies and route IDs are validated.
- Common Prisma errors return suitable HTTP responses.

## Data model

```text
User 1 ──── many Orders
Order 1 ──── many OrderItems
Product 1 ── many OrderItems
```

`OrderItem` is a line on an order. It links one product to one order and stores its quantity and purchase-time price.

## Project structure

```text
week2-Task4/
├── config/
│   └── prisma.js
├── controllers/
├── middleware/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── routes/
├── services/
├── .env.example
├── prisma.config.ts
├── server.js
└── package.json
```

Request flow:

```text
Route → Controller → Service → Prisma Client → PostgreSQL
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the PostgreSQL database

Create an empty database named:

```text
week2_task4_db
```

### 3. Configure the connection

Copy `.env.example` to `.env` and replace the username and password:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/week2_task4_db?schema=public"
```

The real `.env` file is ignored by Git and must not be committed.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply migrations

For local development:

```bash
npx prisma migrate dev
```

For an existing deployment:

```bash
npx prisma migrate deploy
```

### 6. Start the API

```bash
npm run dev
```

The server runs at `http://localhost:3000`.

## API endpoints

| Entity | Create | Read all | Read one | Update | Delete |
|---|---|---|---|---|---|
| Users | `POST /users` | `GET /users` | `GET /users/:id` | `PUT /users/:id` | `DELETE /users/:id` |
| Products | `POST /products` | `GET /products` | `GET /products/:id` | `PUT /products/:id` | `DELETE /products/:id` |
| Orders | `POST /orders` | `GET /orders` | `GET /orders/:id` | `PUT /orders/:id` | `DELETE /orders/:id` |
| Order items | `POST /order-items` | `GET /order-items` | `GET /order-items/:id` | `PUT /order-items/:id` | `DELETE /order-items/:id` |

## Example workflow

Create a user:

```json
{
  "name": "Vinit",
  "email": "vinit@example.com",
  "phone": "9876543210",
  "address": "India"
}
```

Create a product:

```json
{
  "productName": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard",
  "price": 1500.00,
  "stockQuantity": 25
}
```

Create an order using the returned user ID:

```json
{
  "userId": 1,
  "orderDate": "2026-08-08",
  "status": "PENDING",
  "totalAmount": 0
}
```

Add the product to the order:

```json
{
  "orderId": 1,
  "productId": 1,
  "quantity": 2
}
```

If `price` is omitted from the order item, the service copies the product's current price as the purchase-time price.

Fetch the complete relationship:

```http
GET /orders/1
```

The response includes the order's user, order items, and each order item's product through Prisma `include` queries.

## Useful Prisma commands

```bash
npx prisma validate
npx prisma format
npx prisma migrate status
npx prisma studio
```
