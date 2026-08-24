const assert = require("node:assert/strict");
const test = require("node:test");

const { corsOptions } = require("../config/security");
const { loginLimiter } = require("../middleware/rateLimiters");
const { sanitizeInput, sanitizeValue } = require("../middleware/sanitizeInput");

function checkOrigin(origin) {
  return new Promise((resolve) => {
    corsOptions.origin(origin, (error, allowed) => resolve({ allowed, error }));
  });
}

test("CORS allows configured origins and rejects other browser origins", async () => {
  process.env.ALLOWED_ORIGINS = "https://app.example.com, https://admin.example.com";

  const allowed = await checkOrigin("https://app.example.com");
  assert.equal(allowed.error, null);
  assert.equal(allowed.allowed, true);

  const rejected = await checkOrigin("https://attacker.example.com");
  assert.equal(rejected.error.status, 403);
  assert.equal(rejected.allowed, undefined);

  const serverToServer = await checkOrigin(undefined);
  assert.equal(serverToServer.error, null);
  assert.equal(serverToServer.allowed, true);
});

test("sanitization removes active HTML and null bytes from stored fields", () => {
  const input = {
    name: "<script>alert('xss')</script>Alice\0",
    description: '<img src="x" onerror="alert(1)">Safe description',
  };

  const sanitized = sanitizeValue(input);

  assert.equal(sanitized.name, "Alice");
  assert.equal(sanitized.description, "Safe description");
});

test("sanitization never transforms passwords", () => {
  const password = "<strong>literal-password</strong>\0";
  const req = { body: { name: "<b>Alice</b>", password } };
  let nextCalled = false;

  sanitizeInput(req, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.name, "Alice");
  assert.equal(req.body.password, password);
});

test("a dedicated login rate limiter is configured", () => {
  assert.equal(typeof loginLimiter, "function");
});
