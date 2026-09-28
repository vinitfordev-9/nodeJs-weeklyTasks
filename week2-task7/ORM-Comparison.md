# Prisma vs Sequelize vs TypeORM: A Hands-On Comparison

I rebuilt the same e-commerce API—Users, Products, Orders, and OrderItems—with Prisma (Task 4), Sequelize (Task 5), and TypeORM (Task 6). All handled CRUD, but they felt different once relations and migrations were involved.

| Area | Prisma | Sequelize | TypeORM |
|---|---|---|---|
| Developer experience | Fastest. One schema and a predictable generated client made nested reads concise. | Familiar in JavaScript, but models, associations, and migrations repeated information. | Most setup. Decorators were readable, but repositories, DTOs, metadata, and relations added moving parts. |
| Type safety | Best. The generated client knew fields, relations, and query options. | Weakest in our CommonJS implementation; alias and field mistakes were runtime errors. | Strong with strict TypeScript. `Repository<Order>`, `OrderInput`, and `Promise<Order \| null>` made contracts explicit. |
| Migrations | Smoothest: edit the Prisma schema, generate, inspect, and apply. | Most manual. Models and `queryInterface.createTable(...)` migrations could drift. | Capable but configuration-sensitive. The data source must load the right entities and migrations; `synchronize` stays off. |
| Query flexibility | Excellent for normal filters, selections, transactions, and nested relations; unusual SQL may need raw queries. | Close to SQL and supports operators, literals, and raw queries, but complex includes become noisy. | Most flexible structured option: repositories for CRUD and QueryBuilder for joins, aggregates, and dynamic conditions. |

The order-details query showed the clearest difference. Prisma loaded the user, items, and products with a compact nested `include`. Sequelize required model objects and exact `as` aliases. TypeORM expressed the graph as `relations: { user: true, orderItems: { product: true } }`. Prisma was easiest to read; Sequelize was easiest to misconfigure.

The write path exposed another trade-off. Task 5 used Sequelize's Active Record calls: `Order.findByPk`, `Order.create`, `order.update`, and `order.destroy`. They were short, but attached persistence to models. Task 6 injected `Repository<Order>` and `Repository<User>` into `OrderService`, then used `findOneBy`, `create`, `save`, and `remove`. This was longer but made dependencies visible. Prisma stayed concise with `prisma.order.findUnique()` and `prisma.order.create()`.

For a **greenfield TypeScript API**, I recommend **Prisma**. It gave the best combination of speed, generated types, readable relations, and easy migrations. I would choose **TypeORM** when repository injection, domain-oriented architecture, or advanced dynamic QueryBuilder queries matter more than simplicity.

For an **existing JavaScript/CommonJS codebase**, I recommend **Sequelize**. It fits incrementally without TypeScript, decorators, or generated clients. I would offset weaker types with validation and integration tests. If the project were moving fully to TypeScript, I would choose Prisma instead.

Overall, Prisma was most productive, Sequelize was the easiest legacy fit, and TypeORM offered the strongest repository-oriented design and query escape hatch. The right choice depends more on language and architecture than on CRUD capability.
