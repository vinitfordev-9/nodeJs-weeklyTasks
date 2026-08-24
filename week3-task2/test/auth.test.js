const assert = require("node:assert/strict");
const test = require("node:test");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-only-secret-that-is-not-used-by-the-application";

const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const { validateRegister } = require("../middleware/validateAuth");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function requestWithAuthorization(authorization) {
  return {
    get(name) {
      return name.toLowerCase() === "authorization" ? authorization : undefined;
    },
  };
}

test("bcrypt stores a hash that can verify the original password", async () => {
  const plaintext = "secure-password";
  const hash = await bcrypt.hash(plaintext, 4);

  assert.notEqual(hash, plaintext);
  assert.equal(await bcrypt.compare(plaintext, hash), true);
  assert.equal(await bcrypt.compare("incorrect-password", hash), false);
});

test("authentication rejects a missing bearer token with 401", () => {
  const req = requestWithAuthorization(undefined);
  const res = createResponse();

  authenticateToken(req, res, () => assert.fail("next should not be called"));

  assert.equal(res.statusCode, 401);
});

test("authentication verifies a JWT and attaches its user", () => {
  const token = jwt.sign(
    { email: "user@example.com", role: "USER" },
    process.env.JWT_SECRET,
    { algorithm: "HS256", subject: "42", expiresIn: "5m" },
  );
  const req = requestWithAuthorization(`Bearer ${token}`);
  const res = createResponse();
  let nextCalled = false;

  authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    id: 42,
    email: "user@example.com",
    role: "USER",
  });
});

test("authentication rejects invalid and expired JWTs with 401", () => {
  const invalidReq = requestWithAuthorization("Bearer not-a-jwt");
  const invalidRes = createResponse();

  authenticateToken(invalidReq, invalidRes, () => {
    assert.fail("next should not be called for an invalid JWT");
  });
  assert.equal(invalidRes.statusCode, 401);

  const expiredToken = jwt.sign({}, process.env.JWT_SECRET, {
    subject: "42",
    expiresIn: -1,
  });
  const expiredReq = requestWithAuthorization(`Bearer ${expiredToken}`);
  const expiredRes = createResponse();

  authenticateToken(expiredReq, expiredRes, () => {
    assert.fail("next should not be called for an expired JWT");
  });
  assert.equal(expiredRes.statusCode, 401);
  assert.match(expiredRes.body.message, /expired/i);
});

test("role guard allows ADMIN and rejects USER with 403", () => {
  const guard = authorizeRoles("ADMIN");
  const userResponse = createResponse();

  guard({ user: { role: "USER" } }, userResponse, () => {
    assert.fail("next should not be called for the wrong role");
  });
  assert.equal(userResponse.statusCode, 403);

  let nextCalled = false;
  guard({ user: { role: "ADMIN" } }, createResponse(), () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test("public registration cannot assign itself the ADMIN role", () => {
  const req = {
    body: {
      name: "Regular User",
      email: "user@example.com",
      password: "secure-password",
      role: "ADMIN",
    },
  };
  const res = createResponse();
  let nextCalled = false;

  validateRegister(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.role, undefined);
});
