jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn() }));
jest.mock("../config/prisma", () => ({
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const authService = require("../services/authService");

describe("authService", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret";
    delete process.env.JWT_EXPIRES_IN;
  });

  test("register hashes a password, applies safe defaults, and omits the hash", async () => {
    bcrypt.hash.mockResolvedValue("bcrypt-hash");
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: "alice@example.com",
      password: "bcrypt-hash",
      role: "USER",
    });

    await expect(
      authService.register({
        name: "Alice",
        email: "alice@example.com",
        password: "plaintext",
      }),
    ).resolves.toEqual({ id: 1, email: "alice@example.com", role: "USER" });
    expect(bcrypt.hash).toHaveBeenCalledWith("plaintext", 12);
    expect(prisma.user.create.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        password: "bcrypt-hash",
        role: "USER",
        phone: null,
        address: null,
      }),
    );
  });

  test("login returns null for an unknown email without comparing a password", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login({ email: "missing@example.com", password: "secret" }),
    ).resolves.toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test("login returns null for an incorrect password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "alice@example.com",
      password: "stored-hash",
      role: "USER",
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.login({ email: "alice@example.com", password: "wrong" }),
    ).resolves.toBeNull();
    expect(bcrypt.compare).toHaveBeenCalledWith("wrong", "stored-hash");
  });

  test("login signs a role-bearing token and omits the password from output", async () => {
    process.env.JWT_EXPIRES_IN = "30m";
    const storedUser = {
      id: 7,
      email: "admin@example.com",
      password: "stored-hash",
      role: "ADMIN",
    };
    prisma.user.findUnique.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("signed-token");

    await expect(
      authService.login({ email: storedUser.email, password: "correct" }),
    ).resolves.toEqual({
      token: "signed-token",
      user: { id: 7, email: storedUser.email, role: "ADMIN" },
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { email: storedUser.email, role: "ADMIN" },
      "unit-test-secret",
      {
        algorithm: "HS256",
        expiresIn: "30m",
        subject: "7",
      },
    );
  });

  test("login uses the one-hour expiry boundary when no override exists", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "a@example.com",
      password: "hash",
      role: "USER",
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("token");

    await authService.login({ email: "a@example.com", password: "correct" });
    expect(jwt.sign.mock.calls[0][2].expiresIn).toBe("1h");
  });
});
