const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "routing-test-only-secret";
const app = require("../app");
const productService = require("../services/productService");

test("USER can read products while user management and product writes stay restricted", async () => {
  const original = productService.getAllProducts;
  productService.getAllProducts = async () => [];
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const token = jwt.sign(
      { email: "routing@example.com", role: "USER" },
      process.env.JWT_SECRET,
      { subject: "1", expiresIn: "5m" },
    );
    const base = `http://127.0.0.1:${server.address().port}`;
    const headers = { Authorization: `Bearer ${token}` };
    for (const [path, method, expected] of [
      ["/products", "GET", 200],
      ["/users", "GET", 403],
      ["/users/1", "GET", 403],
      ["/products", "POST", 403],
    ]) {
      const response = await fetch(base + path, { method, headers });
      await response.text();
      assert.equal(response.status, expected, `${method} ${path}`);
    }
  } finally {
    productService.getAllProducts = original;
    await new Promise((resolve) => server.close(resolve));
  }
});
