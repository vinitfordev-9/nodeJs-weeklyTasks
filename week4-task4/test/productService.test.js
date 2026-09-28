jest.mock("../config/prisma", () => ({
  product: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock("../services/productCache", () => ({
  invalidateProducts: jest.fn().mockResolvedValue(true),
}));

const prisma = require("../config/prisma");
const productCache = require("../services/productCache");
const productService = require("../services/productService");

describe("productService", () => {
  test("getAllProducts returns products with their order items", async () => {
    const products = [{ id: 1, orderItems: [] }];
    prisma.product.findMany.mockResolvedValue(products);

    await expect(productService.getAllProducts()).resolves.toBe(products);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      include: { orderItems: true },
    });
  });

  test("getProductById returns null at the missing-record edge", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(productService.getProductById(999)).resolves.toBeNull();
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      include: { orderItems: true },
    });
  });

  test("createProduct preserves a zero stock boundary and defaults description", async () => {
    const created = { id: 1, stockQuantity: 0 };
    prisma.product.create.mockResolvedValue(created);

    await expect(
      productService.createProduct({
        productName: "Keyboard",
        price: 100,
        stockQuantity: 0,
      }),
    ).resolves.toBe(created);
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        productName: "Keyboard",
        description: null,
        price: 100,
        stockQuantity: 0,
      },
    });
    expect(productCache.invalidateProducts).toHaveBeenCalledTimes(1);
  });

  test("updateProduct returns null without issuing an update when missing", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(productService.updateProduct(7, {})).resolves.toBeNull();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  test("updateProduct updates an existing product", async () => {
    const updated = { id: 7, productName: "Mouse" };
    prisma.product.findUnique.mockResolvedValue({ id: 7 });
    prisma.product.update.mockResolvedValue(updated);

    await expect(
      productService.updateProduct(7, {
        productName: "Mouse",
        description: "Wireless",
        price: 25,
        stockQuantity: 2,
      }),
    ).resolves.toBe(updated);
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        productName: "Mouse",
        description: "Wireless",
        price: 25,
        stockQuantity: 2,
      },
    });
    expect(productCache.invalidateProducts).toHaveBeenCalledTimes(1);
  });

  test("deleteProduct handles both missing and existing products", async () => {
    prisma.product.findUnique.mockResolvedValueOnce(null);
    await expect(productService.deleteProduct(8)).resolves.toBeNull();

    const deleted = { id: 8 };
    prisma.product.findUnique.mockResolvedValueOnce({ id: 8 });
    prisma.product.delete.mockResolvedValue(deleted);
    await expect(productService.deleteProduct(8)).resolves.toBe(deleted);
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 8 } });
    expect(productCache.invalidateProducts).toHaveBeenCalledTimes(1);
  });
});
