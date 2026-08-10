# Week 2 Task 6 — TypeORM E-commerce API

The Week 2 Task 4/5 e-commerce REST API rebuilt in **TypeScript** with **Express** and **TypeORM**. It uses TypeORM's Data Mapper/repository pattern only—entities contain no persistence methods.

## Requirements covered

- `@Entity`, `@Column`, `@OneToMany`, `@ManyToOne`, and `@JoinColumn` decorators define the model.
- Services receive TypeORM `Repository<Entity>` instances through their constructors.
- No Active Record (`BaseEntity`) methods and no raw SQL in application data access.
- A reversible initial migration creates all tables, checks, unique constraints, and foreign keys.
- Typed controllers, DTOs, services, middleware, and CRUD endpoints.
- Integration tests exercise create, read, update, delete, validation, and nested relations.

## Data model

```text
User 1 ──── many Orders
Order 1 ─── many OrderItems
Product 1 ─ many OrderItems
```

## Setup

```bash
npm install
cp .env.example .env
npm run migration:run
npm run dev
```

The API runs at `http://localhost:3000`. SQLite is stored in `database.sqlite`, so no external database server is needed.

## TypeORM CLI

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate
```

`synchronize` is deliberately disabled. Start-up safely runs pending checked-in migrations.

## Endpoints

| Entity | Create | Read all | Read one | Update | Delete |
|---|---|---|---|---|---|
| Users | `POST /users` | `GET /users` | `GET /users/:id` | `PUT /users/:id` | `DELETE /users/:id` |
| Products | `POST /products` | `GET /products` | `GET /products/:id` | `PUT /products/:id` | `DELETE /products/:id` |
| Orders | `POST /orders` | `GET /orders` | `GET /orders/:id` | `PUT /orders/:id` | `DELETE /orders/:id` |
| Order items | `POST /order-items` | `GET /order-items` | `GET /order-items/:id` | `PUT /order-items/:id` | `DELETE /order-items/:id` |

Example user:

```json
{
  "name": "Vinit",
  "email": "vinit@example.com",
  "phone": "9876543210",
  "address": "India"
}
```

Example product:

```json
{
  "productName": "Mechanical Keyboard",
  "description": "RGB mechanical keyboard",
  "price": 1500,
  "stockQuantity": 25
}
```

Example order:

```json
{
  "userId": 1,
  "orderDate": "2026-08-10",
  "status": "PENDING",
  "totalAmount": 1500
}
```

Example order item (price defaults to the product's current price):

```json
{
  "orderId": 1,
  "productId": 1,
  "quantity": 1
}
```

Run verification with:

```bash
npm run build
npm test
```
