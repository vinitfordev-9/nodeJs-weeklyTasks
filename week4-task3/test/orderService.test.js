jest.mock("../config/prisma", () => ({
  order: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: { findUnique: jest.fn() },
}));

const prisma = require("../config/prisma");
const orderService = require("../services/orderService");

describe("orderService", () => {
  test("getAllOrders returns the repository result", async () => {
    const orders = [{ id: 1 }];
    prisma.order.findMany.mockResolvedValue(orders);
    await expect(orderService.getAllOrders()).resolves.toBe(orders);
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
  });

  test("getOrderById passes the requested ID", async () => {
    const order = { id: 4 };
    prisma.order.findUnique.mockResolvedValue(order);
    await expect(orderService.getOrderById(4)).resolves.toBe(order);
    expect(prisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 4 } }),
    );
  });

  test("createOrder rejects an invalid user relation with status 400", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      orderService.createOrder({ userId: 99, orderDate: new Date() }),
    ).rejects.toMatchObject({ message: "User not found", status: 400 });
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  test("createOrder defaults optional fields to null", async () => {
    const orderDate = new Date("2026-08-24");
    const created = { id: 1, userId: 2 };
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.order.create.mockResolvedValue(created);

    await expect(
      orderService.createOrder({ userId: 2, orderDate }),
    ).resolves.toBe(created);
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 2,
          orderDate,
          status: null,
          totalAmount: null,
        },
      }),
    );
  });

  test("updateOrder returns null when the order does not exist", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(orderService.updateOrder(1, {})).resolves.toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  test("updateOrder validates the user and retains a zero total", async () => {
    const orderDate = new Date("2026-08-24");
    prisma.order.findUnique.mockResolvedValue({ id: 1 });
    prisma.user.findUnique.mockResolvedValue({ id: 2 });
    prisma.order.update.mockResolvedValue({ id: 1, totalAmount: 0 });

    await orderService.updateOrder(1, {
      userId: 2,
      orderDate,
      status: "PENDING",
      totalAmount: 0,
    });
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 2,
          orderDate,
          status: "PENDING",
          totalAmount: 0,
        },
      }),
    );
  });

  test("deleteOrder handles missing and existing records", async () => {
    prisma.order.findUnique.mockResolvedValueOnce(null);
    await expect(orderService.deleteOrder(3)).resolves.toBeNull();

    prisma.order.findUnique.mockResolvedValueOnce({ id: 3 });
    prisma.order.delete.mockResolvedValue({ id: 3 });
    await expect(orderService.deleteOrder(3)).resolves.toEqual({ id: 3 });
    expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });
});
