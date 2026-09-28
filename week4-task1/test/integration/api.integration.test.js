process.env.NODE_ENV = "test";
process.env.TEST_DATABASE_MODE = "memory";
process.env.JWT_SECRET = "integration-test-secret-never-use-in-production";
process.env.JWT_EXPIRES_IN = "5m";
process.env.ALLOWED_ORIGINS = "http://test-client.local";
process.env.LOGIN_RATE_WINDOW_MS = "60000";
process.env.LOGIN_RATE_LIMIT = "1000";
process.env.REDIS_CACHE_ENABLED = "false";

if (process.env.NODE_ENV !== "test" || process.env.TEST_DATABASE_MODE !== "memory") {
  throw new Error("Integration tests must use the isolated test database");
}

jest.mock("sanitize-html", () =>
  jest.fn((value) =>
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, ""),
  ),
);

jest.mock("../../config/prisma", () =>
  require("../helpers/testDatabase").prisma,
);

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const app = require("../../app");
const testDatabase = require("../helpers/testDatabase");

const validProduct = {
  productName: "Webcam",
  description: "1080p camera",
  price: 60,
  stockQuantity: 5,
};
const validOrder = {
  userId: 2,
  orderDate: "2026-08-24",
  status: "PENDING",
  totalAmount: 100,
};
const validOrderItem = {
  orderId: 1,
  productId: 2,
  quantity: 2,
  price: 25,
};
const validUser = {
  name: "Created User",
  email: "created@example.com",
  password: "strong-password",
  role: "USER",
};

let passwordHash;
let adminToken;
let userToken;
let consoleLogSpy;
let consoleErrorSpy;

function api(method, path, token) {
  const call = request(app)[method](path);
  return token ? call.set("Authorization", `Bearer ${token}`) : call;
}

beforeAll(async () => {
  passwordHash = await bcrypt.hash("correct-password", 4);
  consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

beforeEach(() => {
  testDatabase.reset(passwordHash);
  adminToken = jwt.sign(
    { email: "admin@example.com", role: "ADMIN" },
    process.env.JWT_SECRET,
    { subject: "1", expiresIn: "5m" },
  );
  userToken = jwt.sign(
    { email: "user@example.com", role: "USER" },
    process.env.JWT_SECRET,
    { subject: "2", expiresIn: "5m" },
  );
});

afterAll(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

describe("public endpoints", () => {
  test("GET / returns the health response", async () => {
    const response = await request(app).get("/").expect(200);
    expect(response.text).toBe("E-commerce API is running...");
    expect(response.headers).toHaveProperty("x-content-type-options", "nosniff");
  });

  test("GET / rejects an unexpected browser origin", async () => {
    await request(app)
      .get("/")
      .set("Origin", "https://attacker.example.com")
      .expect(403);
  });

  test("POST /register creates a sanitized USER account", async () => {
    const response = await request(app)
      .post("/register")
      .send({
        name: "<b>New User</b>",
        email: "new@example.com",
        password: "strong-password",
        role: "ADMIN",
      })
      .expect(201);

    expect(response.body.user).toMatchObject({
      name: "New User",
      email: "new@example.com",
      role: "USER",
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("POST /register rejects invalid input", async () => {
    const response = await request(app)
      .post("/register")
      .send({ email: "not-an-email", password: "short" })
      .expect(400);
    expect(response.body.message).toBe("Validation failed");
  });

  test("POST /login returns a valid token for correct credentials", async () => {
    const response = await request(app)
      .post("/login")
      .send({ email: "user@example.com", password: "correct-password" })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(jwt.verify(response.body.token, process.env.JWT_SECRET)).toMatchObject({
      email: "user@example.com",
      role: "USER",
    });
  });

  test("POST /login rejects incorrect credentials", async () => {
    await request(app)
      .post("/login")
      .send({ email: "user@example.com", password: "incorrect" })
      .expect(401, { message: "Invalid email or password" });
  });
});

describe("authentication on every protected endpoint", () => {
  const protectedRequests = [
    { method: "get", path: "/users" },
    { method: "get", path: "/users/2" },
    { method: "post", path: "/users", body: validUser },
    { method: "put", path: "/users/2", body: validUser },
    { method: "delete", path: "/users/3" },
    { method: "get", path: "/products" },
    { method: "get", path: "/products/1" },
    { method: "post", path: "/products", body: validProduct },
    { method: "put", path: "/products/1", body: validProduct },
    { method: "delete", path: "/products/2" },
    { method: "get", path: "/orders" },
    { method: "get", path: "/orders/1" },
    { method: "post", path: "/orders", body: validOrder },
    { method: "put", path: "/orders/1", body: validOrder },
    { method: "delete", path: "/orders/2" },
    { method: "get", path: "/order-items" },
    { method: "get", path: "/order-items/1" },
    { method: "post", path: "/order-items", body: validOrderItem },
    { method: "put", path: "/order-items/1", body: validOrderItem },
    { method: "delete", path: "/order-items/1" },
  ];

  test.each(protectedRequests)(
    "$method $path returns 401 without a token",
    async ({ method, path, body }) => {
      const call = api(method, path);
      if (body) call.send(body);
      await call.expect(401);
    },
  );

  test("a valid USER token passes authentication but fails ADMIN authorization", async () => {
    await api("post", "/products", userToken).send(validProduct).expect(403);
  });
});

describe("user endpoints", () => {
  test("GET /users returns users to an administrator", async () => {
    const response = await api("get", "/users", adminToken).expect(200);
    expect(response.body).toHaveLength(3);
    expect(response.body[0]).not.toHaveProperty("password");
  });

  test("GET /users/:id returns one user", async () => {
    const response = await api("get", "/users/2", adminToken).expect(200);
    expect(response.body).toMatchObject({ id: 2, role: "USER" });
  });

  test("GET /users/:id returns 404 for a missing user", async () => {
    await api("get", "/users/999", adminToken).expect(404);
  });

  test("POST /users creates a user", async () => {
    const response = await api("post", "/users", adminToken)
      .send(validUser)
      .expect(201);
    expect(response.body).toMatchObject({ id: 4, email: validUser.email });
  });

  test("POST /users rejects an invalid body", async () => {
    await api("post", "/users", adminToken).send({ name: "Missing fields" }).expect(400);
  });

  test("PUT /users/:id updates a user", async () => {
    const response = await api("put", "/users/2", adminToken)
      .send({ ...validUser, email: "updated@example.com", role: "ADMIN" })
      .expect(200);
    expect(response.body).toMatchObject({ email: "updated@example.com", role: "ADMIN" });
  });

  test("PUT /users/:id returns 404 for a missing user", async () => {
    await api("put", "/users/999", adminToken).send(validUser).expect(404);
  });

  test("DELETE /users/:id deletes an unreferenced user", async () => {
    const response = await api("delete", "/users/3", adminToken).expect(200);
    expect(response.body.deletedUser.id).toBe(3);
  });

  test("DELETE /users/:id returns 404 for a missing user", async () => {
    await api("delete", "/users/999", adminToken).expect(404);
  });
});

describe("product endpoints", () => {
  test("GET /products returns products with a valid token", async () => {
    const response = await api("get", "/products", userToken).expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.headers["x-cache"]).toBe("BYPASS");
  });

  test("GET /products/:id returns one product", async () => {
    const response = await api("get", "/products/1", userToken).expect(200);
    expect(response.body.productName).toBe("Keyboard");
  });

  test("GET /products/:id returns 404 when missing", async () => {
    await api("get", "/products/999", userToken).expect(404);
  });

  test("POST /products creates a product for ADMIN", async () => {
    const response = await api("post", "/products", adminToken)
      .send(validProduct)
      .expect(201);
    expect(response.body).toMatchObject({ id: 3, productName: "Webcam" });
  });

  test("POST /products rejects invalid input", async () => {
    await api("post", "/products", adminToken)
      .send({ productName: "Invalid", price: -1, stockQuantity: -1 })
      .expect(400);
  });

  test("PUT /products/:id updates a product for ADMIN", async () => {
    const response = await api("put", "/products/1", adminToken)
      .send({ ...validProduct, productName: "Updated Webcam" })
      .expect(200);
    expect(response.body.productName).toBe("Updated Webcam");
  });

  test("PUT /products/:id returns 404 when missing", async () => {
    await api("put", "/products/999", adminToken).send(validProduct).expect(404);
  });

  test("DELETE /products/:id deletes an unreferenced product", async () => {
    const response = await api("delete", "/products/2", adminToken).expect(200);
    expect(response.body.deletedProduct.id).toBe(2);
  });

  test("DELETE /products/:id returns 404 when missing", async () => {
    await api("delete", "/products/999", adminToken).expect(404);
  });
});

describe("order endpoints", () => {
  test("GET /orders returns orders", async () => {
    const response = await api("get", "/orders", userToken).expect(200);
    expect(response.body).toHaveLength(2);
  });

  test("GET /orders/:id returns one order", async () => {
    const response = await api("get", "/orders/1", userToken).expect(200);
    expect(response.body).toMatchObject({ id: 1, userId: 2 });
  });

  test("GET /orders/:id returns 404 when missing", async () => {
    await api("get", "/orders/999", userToken).expect(404);
  });

  test("POST /orders creates an order", async () => {
    const response = await api("post", "/orders", userToken)
      .send(validOrder)
      .expect(201);
    expect(response.body).toMatchObject({ id: 3, userId: 2 });
  });

  test("POST /orders rejects a missing related user", async () => {
    await api("post", "/orders", userToken)
      .send({ ...validOrder, userId: 999 })
      .expect(400);
  });

  test("PUT /orders/:id updates an order", async () => {
    const response = await api("put", "/orders/1", userToken)
      .send({ ...validOrder, status: "PAID" })
      .expect(200);
    expect(response.body.status).toBe("PAID");
  });

  test("PUT /orders/:id returns 404 when missing", async () => {
    await api("put", "/orders/999", userToken).send(validOrder).expect(404);
  });

  test("DELETE /orders/:id deletes an order without items", async () => {
    const response = await api("delete", "/orders/2", userToken).expect(200);
    expect(response.body.deletedOrder.id).toBe(2);
  });

  test("DELETE /orders/:id returns 404 when missing", async () => {
    await api("delete", "/orders/999", userToken).expect(404);
  });
});

describe("order-item endpoints", () => {
  test("GET /order-items returns order items", async () => {
    const response = await api("get", "/order-items", userToken).expect(200);
    expect(response.body).toHaveLength(1);
  });

  test("GET /order-items/:id returns one item", async () => {
    const response = await api("get", "/order-items/1", userToken).expect(200);
    expect(response.body).toMatchObject({ id: 1, orderId: 1, productId: 1 });
  });

  test("GET /order-items/:id returns 404 when missing", async () => {
    await api("get", "/order-items/999", userToken).expect(404);
  });

  test("POST /order-items creates an item", async () => {
    const response = await api("post", "/order-items", userToken)
      .send(validOrderItem)
      .expect(201);
    expect(response.body).toMatchObject({ id: 2, orderId: 1, productId: 2 });
  });

  test("POST /order-items rejects a missing related order", async () => {
    await api("post", "/order-items", userToken)
      .send({ ...validOrderItem, orderId: 999 })
      .expect(400);
  });

  test("PUT /order-items/:id updates an item", async () => {
    const response = await api("put", "/order-items/1", userToken)
      .send({ ...validOrderItem, quantity: 3 })
      .expect(200);
    expect(response.body).toMatchObject({ id: 1, quantity: 3, productId: 2 });
  });

  test("PUT /order-items/:id returns 404 when missing", async () => {
    await api("put", "/order-items/999", userToken).send(validOrderItem).expect(404);
  });

  test("DELETE /order-items/:id deletes an item", async () => {
    const response = await api("delete", "/order-items/1", userToken).expect(200);
    expect(response.body.deletedOrderItem.id).toBe(1);
  });

  test("DELETE /order-items/:id returns 404 when missing", async () => {
    await api("delete", "/order-items/999", userToken).expect(404);
  });
});
