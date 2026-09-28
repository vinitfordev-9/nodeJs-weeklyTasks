jest.mock("bcrypt", () => ({ hash: jest.fn() }));
jest.mock("../config/prisma", () => ({
  user: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { PUBLIC_USER_FIELDS } = require("../config/prismaSelects");
const userService = require("../services/userService");

describe("userService", () => {
  test("getAllUsers selects only public fields", async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await expect(userService.getAllUsers()).resolves.toEqual([]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: PUBLIC_USER_FIELDS,
    });
  });

  test("getUserById selects public fields and orders", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 2, orders: [] });
    await expect(userService.getUserById(2)).resolves.toEqual({ id: 2, orders: [] });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      select: { ...PUBLIC_USER_FIELDS, orders: true },
    });
  });

  test("createUser hashes the password and defaults nullable fields", async () => {
    bcrypt.hash.mockResolvedValue("bcrypt-hash");
    prisma.user.create.mockResolvedValue({ id: 1, role: "USER" });

    await userService.createUser({
      name: "Alice",
      email: "alice@example.com",
      password: "plaintext",
      role: "USER",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("plaintext", 12);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        name: "Alice",
        email: "alice@example.com",
        password: "bcrypt-hash",
        role: "USER",
        phone: null,
        address: null,
      },
      select: PUBLIC_USER_FIELDS,
    });
  });

  test("updateUser returns null when the user is missing", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(userService.updateUser(9, {})).resolves.toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  test("updateUser does not replace a password when it is omitted", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    prisma.user.update.mockResolvedValue({ id: 1 });

    await userService.updateUser(1, {
      name: "Alice",
      email: "alice@example.com",
      role: "USER",
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty("password");
  });

  test("updateUser hashes a replacement password", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    bcrypt.hash.mockResolvedValue("new-hash");
    prisma.user.update.mockResolvedValue({ id: 1 });

    await userService.updateUser(1, {
      name: "Alice",
      email: "alice@example.com",
      role: "ADMIN",
      password: "replacement",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("replacement", 12);
    expect(prisma.user.update.mock.calls[0][0].data.password).toBe("new-hash");
  });

  test("deleteUser handles missing and existing users", async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(userService.deleteUser(2)).resolves.toBeNull();

    prisma.user.findUnique.mockResolvedValueOnce({ id: 2 });
    prisma.user.delete.mockResolvedValue({ id: 2 });
    await expect(userService.deleteUser(2)).resolves.toEqual({ id: 2 });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 2 },
      select: PUBLIC_USER_FIELDS,
    });
  });
});
