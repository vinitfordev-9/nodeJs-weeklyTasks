# Week 2 Task 5 — Sequelize E-commerce API

The Week 2 Task 4 e-commerce REST API rebuilt with **Node.js**, **Express**, **Sequelize**, and **MySQL**. It preserves the User, Product, Order, and OrderItem CRUD endpoints from the Prisma version while replacing its entire data-access layer with Sequelize.

## Assignment requirements covered

- Sequelize models define explicit MySQL types, nullability, primary keys, unique constraints, and foreign keys.
- Associations are defined in both directions and used by service queries.
- Sequelize migrations create every table; the application never calls `sync()`.
- All CRUD endpoints operate against MySQL.

## Data model

```text
User 1 ──── many Orders
Order 1 ─── many OrderItems
Product 1 ─ many OrderItems
```

`OrderItem` connects an order to a product and stores its quantity and purchase-time price. Fetching an order includes its user, line items, and each line item's product.

## Setup

```bash
npm install
cp .env.example .env
npm run db:create
npm run db:migrate
npm start
```

The default database is `week2_task5_db` and the API runs at `http://localhost:3000`. Update the `DB_*` values in `.env` if your MySQL credentials differ.

## Endpoints

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
  "price": 1500,
  "stockQuantity": 25
}
```

Create an order:

```json
{
  "userId": 1,
  "orderDate": "2026-08-09",
  "status": "PENDING",
  "totalAmount": 1500
}
```

Add an order item:

```json
{
  "orderId": 1,
  "productId": 1,
  "quantity": 1
}
```

If an order-item price is omitted, the service stores the product's current price. `GET /orders/:id` demonstrates nested association loading.

## Architecture

```text
Route → Controller → Service → Sequelize Model → MySQL
```

Use `npm run db:migrate` to update the schema. Do not use `sequelize.sync({ force: true })`.
