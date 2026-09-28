const jwt = require("jsonwebtoken");

const { getJwtSecret } = require("../config/auth");
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
    get: jest.fn(() => authorization),
  };
}

describe("authentication utilities", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-only-secret-that-is-not-used-in-production";
  });

  test("getJwtSecret returns configuration and rejects an empty value", () => {
    expect(getJwtSecret()).toBe(process.env.JWT_SECRET);

    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow("JWT_SECRET environment variable is required");
    try {
      getJwtSecret();
    } catch (error) {
      expect(error.status).toBe(500);
    }
  });

  test("authentication rejects missing and malformed authorization", () => {
    const missingResponse = createResponse();
    authenticateToken(requestWithAuthorization(undefined), missingResponse, jest.fn());
    expect(missingResponse.statusCode).toBe(401);

    const malformedResponse = createResponse();
    authenticateToken(
      requestWithAuthorization("Basic credentials"),
      malformedResponse,
      jest.fn(),
    );
    expect(malformedResponse.statusCode).toBe(401);
  });

  test("authentication attaches valid signed user claims", () => {
    const token = jwt.sign(
      { email: "user@example.com", role: "USER" },
      process.env.JWT_SECRET,
      { subject: "42", expiresIn: "5m" },
    );
    const req = requestWithAuthorization(`Bearer ${token}`);
    const next = jest.fn();

    authenticateToken(req, createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      id: 42,
      email: "user@example.com",
      role: "USER",
    });
  });

  test("authentication rejects invalid claims, signatures, and expiry", () => {
    const invalidClaims = jwt.sign(
      { email: "user@example.com", role: "ROOT" },
      process.env.JWT_SECRET,
    );
    const invalidClaimsResponse = createResponse();
    authenticateToken(
      requestWithAuthorization(`Bearer ${invalidClaims}`),
      invalidClaimsResponse,
      jest.fn(),
    );
    expect(invalidClaimsResponse.statusCode).toBe(401);

    const invalidSignatureResponse = createResponse();
    authenticateToken(
      requestWithAuthorization("Bearer not-a-jwt"),
      invalidSignatureResponse,
      jest.fn(),
    );
    expect(invalidSignatureResponse.statusCode).toBe(401);

    const expired = jwt.sign(
      { email: "user@example.com", role: "USER" },
      process.env.JWT_SECRET,
      { subject: "42", expiresIn: -1 },
    );
    const expiredResponse = createResponse();
    authenticateToken(
      requestWithAuthorization(`Bearer ${expired}`),
      expiredResponse,
      jest.fn(),
    );
    expect(expiredResponse.statusCode).toBe(401);
    expect(expiredResponse.body.message).toMatch(/expired/i);
  });

  test("role guard distinguishes unauthenticated, forbidden, and allowed access", () => {
    const guard = authorizeRoles("ADMIN");

    const unauthenticated = createResponse();
    guard({}, unauthenticated, jest.fn());
    expect(unauthenticated.statusCode).toBe(401);

    const forbidden = createResponse();
    guard({ user: { role: "USER" } }, forbidden, jest.fn());
    expect(forbidden.statusCode).toBe(403);

    const next = jest.fn();
    guard({ user: { role: "ADMIN" } }, createResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("registration validation strips attempted ADMIN self-assignment", () => {
    const req = {
      body: {
        name: "Regular User",
        email: "user@example.com",
        password: "secure-password",
        role: "ADMIN",
      },
    };
    const next = jest.fn();

    validateRegister(req, createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.role).toBeUndefined();
  });
});
