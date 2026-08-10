import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import request from "supertest";
import { app } from "../src/app";
import { AppDataSource } from "../src/data-source";
import { Order } from "../src/entities/Order";
import { OrderItem } from "../src/entities/OrderItem";
import { Product } from "../src/entities/Product";
import { User } from "../src/entities/User";

before(async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  await AppDataSource.getRepository(OrderItem).clear();
  await AppDataSource.getRepository(Order).clear();
  await AppDataSource.getRepository(Product).clear();
  await AppDataSource.getRepository(User).clear();
});

after(async () => {
  await AppDataSource.destroy();
});

test("all four resources support their CRUD workflow", async () => {
  const user = (await request(app).post("/users").send({
    name: "Vinit",
    email: "vinit@example.com",
    phone: "9876543210",
    address: "India",
  }).expect(201)).body;

  const product = (await request(app).post("/products").send({
    productName: "Mechanical Keyboard",
    description: "RGB keyboard",
    price: 1500,
    stockQuantity: 25,
  }).expect(201)).body;

  const order = (await request(app).post("/orders").send({
    userId: user.id,
    orderDate: "2026-08-10",
    status: "PENDING",
    totalAmount: 1500,
  }).expect(201)).body;

  const item = (await request(app).post("/order-items").send({
    orderId: order.id,
    productId: product.id,
    quantity: 1,
  }).expect(201)).body;
  assert.equal(Number(item.price), 1500);

  const nestedOrder = (await request(app).get(`/orders/${order.id}`).expect(200)).body;
  assert.equal(nestedOrder.user.email, "vinit@example.com");
  assert.equal(nestedOrder.orderItems[0].product.productName, "Mechanical Keyboard");

  await request(app).put(`/users/${user.id}`).send({ ...user, name: "Vinit Updated" }).expect(200);
  await request(app).put(`/products/${product.id}`).send({ ...product, price: 1400 }).expect(200);
  await request(app).put(`/orders/${order.id}`).send({ ...order, status: "PAID" }).expect(200);
  await request(app).put(`/order-items/${item.id}`).send({ ...item, quantity: 2 }).expect(200);

  await request(app).get("/users").expect(200);
  await request(app).get("/products").expect(200);
  await request(app).get("/orders").expect(200);
  await request(app).get("/order-items").expect(200);

  await request(app).delete(`/order-items/${item.id}`).expect(200);
  await request(app).delete(`/orders/${order.id}`).expect(200);
  await request(app).delete(`/products/${product.id}`).expect(200);
  await request(app).delete(`/users/${user.id}`).expect(200);
});

test("invalid IDs and request bodies return 400", async () => {
  await request(app).get("/users/not-a-number").expect(400);
  await request(app).post("/products").send({ productName: "Missing fields" }).expect(400);
});
