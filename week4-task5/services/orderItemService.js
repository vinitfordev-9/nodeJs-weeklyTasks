const prisma = require("../config/prisma");
const { PUBLIC_USER_FIELDS } = require("../config/prismaSelects");
const productCache = require("./productCache");

const orderItemRelations = {
  order: {
    include: {
      user: {
        select: PUBLIC_USER_FIELDS,
      },
    },
  },
  product: true,
};

async function getAllOrderItems() {
  return prisma.orderItem.findMany({
    include: orderItemRelations,
  });
}

async function getOrderItemById(id) {
  return prisma.orderItem.findUnique({
    where: { id },
    include: orderItemRelations,
  });
}

async function getRelatedRecords(orderId, productId) {
  const [order, product] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true },
    }),
  ]);

  if (!order) {
    const error = new Error("Order not found");
    error.status = 400;
    throw error;
  }

  if (!product) {
    const error = new Error("Product not found");
    error.status = 400;
    throw error;
  }

  return { product };
}

async function createOrderItem(orderItemData) {
  const { product } = await getRelatedRecords(
    orderItemData.orderId,
    orderItemData.productId,
  );

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: orderItemData.orderId,
      productId: orderItemData.productId,
      quantity: orderItemData.quantity,
      price: orderItemData.price ?? product.price,
    },
    include: orderItemRelations,
  });
  await productCache.invalidateProducts();
  return orderItem;
}

async function updateOrderItem(id, orderItemData) {
  const existingOrderItem = await prisma.orderItem.findUnique({
    where: { id },
  });

  if (!existingOrderItem) {
    return null;
  }

  const { product } = await getRelatedRecords(
    orderItemData.orderId,
    orderItemData.productId,
  );

  const orderItem = await prisma.orderItem.update({
    where: { id },
    data: {
      orderId: orderItemData.orderId,
      productId: orderItemData.productId,
      quantity: orderItemData.quantity,
      price: orderItemData.price ?? existingOrderItem.price ?? product.price,
    },
    include: orderItemRelations,
  });
  await productCache.invalidateProducts();
  return orderItem;
}

async function deleteOrderItem(id) {
  const existingOrderItem = await prisma.orderItem.findUnique({
    where: { id },
  });

  if (!existingOrderItem) {
    return null;
  }

  const orderItem = await prisma.orderItem.delete({
    where: { id },
  });
  await productCache.invalidateProducts();
  return orderItem;
}

module.exports = {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
