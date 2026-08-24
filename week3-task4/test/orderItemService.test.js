jest.mock("../config/prisma", () => ({
  order: { findUnique: jest.fn() },
  orderItem: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  product: { findUnique: jest.fn() },
}));

const prisma = require("../config/prisma");
const orderItemService = require("../services/orderItemService");

describe("orderItemService", () => {
  test("getAllOrderItems returns all related records", async () => {
    const items = [{ id: 1 }];
    prisma.orderItem.findMany.mockResolvedValue(items);
    await expect(orderItemService.getAllOrderItems()).resolves.toBe(items);
    expect(prisma.orderItem.findMany).toHaveBeenCalledTimes(1);
  });

  test("getOrderItemById returns null for an unknown ID", async () => {
    prisma.orderItem.findUnique.mockResolvedValue(null);
    await expect(orderItemService.getOrderItemById(100)).resolves.toBeNull();
    expect(prisma.orderItem.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 100 } }),
    );
  });

  test("createOrderItem rejects a missing order", async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    prisma.product.findUnique.mockResolvedValue({ id: 2, price: 20 });

    await expect(
      orderItemService.createOrderItem({ orderId: 50, productId: 2, quantity: 1 }),
    ).rejects.toMatchObject({ message: "Order not found", status: 400 });
    expect(prisma.orderItem.create).not.toHaveBeenCalled();
  });

  test("createOrderItem rejects a missing product", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1 });
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(
      orderItemService.createOrderItem({ orderId: 1, productId: 50, quantity: 1 }),
    ).rejects.toMatchObject({ message: "Product not found", status: 400 });
  });

  test("createOrderItem defaults to the current product price", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1 });
    prisma.product.findUnique.mockResolvedValue({ id: 2, price: 20 });
    prisma.orderItem.create.mockResolvedValue({ id: 3, price: 20 });

    await expect(
      orderItemService.createOrderItem({ orderId: 1, productId: 2, quantity: 1 }),
    ).resolves.toEqual({ id: 3, price: 20 });
    expect(prisma.orderItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { orderId: 1, productId: 2, quantity: 1, price: 20 },
      }),
    );
  });

  test("createOrderItem preserves an explicitly supplied zero price", async () => {
    prisma.order.findUnique.mockResolvedValue({ id: 1 });
    prisma.product.findUnique.mockResolvedValue({ id: 2, price: 20 });
    prisma.orderItem.create.mockResolvedValue({ id: 3, price: 0 });

    await orderItemService.createOrderItem({
      orderId: 1,
      productId: 2,
      quantity: 1,
      price: 0,
    });
    expect(prisma.orderItem.create.mock.calls[0][0].data.price).toBe(0);
  });

  test("updateOrderItem returns null when the item is missing", async () => {
    prisma.orderItem.findUnique.mockResolvedValue(null);
    await expect(orderItemService.updateOrderItem(1, {})).resolves.toBeNull();
    expect(prisma.orderItem.update).not.toHaveBeenCalled();
  });

  test("updateOrderItem falls back to the existing purchase price", async () => {
    prisma.orderItem.findUnique.mockResolvedValue({ id: 1, price: 15 });
    prisma.order.findUnique.mockResolvedValue({ id: 2 });
    prisma.product.findUnique.mockResolvedValue({ id: 3, price: 20 });
    prisma.orderItem.update.mockResolvedValue({ id: 1, price: 15 });

    await orderItemService.updateOrderItem(1, {
      orderId: 2,
      productId: 3,
      quantity: 4,
    });
    expect(prisma.orderItem.update.mock.calls[0][0].data.price).toBe(15);
  });

  test("updateOrderItem uses product price when both supplied and old prices are null", async () => {
    prisma.orderItem.findUnique.mockResolvedValue({ id: 1, price: null });
    prisma.order.findUnique.mockResolvedValue({ id: 2 });
    prisma.product.findUnique.mockResolvedValue({ id: 3, price: 20 });
    prisma.orderItem.update.mockResolvedValue({ id: 1, price: 20 });

    await orderItemService.updateOrderItem(1, {
      orderId: 2,
      productId: 3,
      quantity: 4,
    });
    expect(prisma.orderItem.update.mock.calls[0][0].data.price).toBe(20);
  });

  test("deleteOrderItem handles missing and existing items", async () => {
    prisma.orderItem.findUnique.mockResolvedValueOnce(null);
    await expect(orderItemService.deleteOrderItem(6)).resolves.toBeNull();

    prisma.orderItem.findUnique.mockResolvedValueOnce({ id: 6 });
    prisma.orderItem.delete.mockResolvedValue({ id: 6 });
    await expect(orderItemService.deleteOrderItem(6)).resolves.toEqual({ id: 6 });
    expect(prisma.orderItem.delete).toHaveBeenCalledWith({ where: { id: 6 } });
  });
});
