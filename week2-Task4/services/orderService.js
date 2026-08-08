const prisma = require("../config/prisma");

const orderRelations = {
  user: true,
  orderItems: {
    include: {
      product: true,
    },
  },
};

async function getAllOrders() {
  return prisma.order.findMany({
    include: orderRelations,
  });
}

async function getOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: orderRelations,
  });
}

async function ensureUserExists(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 400;
    throw error;
  }
}

async function createOrder(orderData) {
  await ensureUserExists(orderData.userId);

  return prisma.order.create({
    data: {
      userId: orderData.userId,
      orderDate: orderData.orderDate,
      status: orderData.status ?? null,
      totalAmount: orderData.totalAmount ?? null,
    },
    include: orderRelations,
  });
}

async function updateOrder(id, orderData) {
  const existingOrder = await prisma.order.findUnique({ where: { id } });

  if (!existingOrder) {
    return null;
  }

  await ensureUserExists(orderData.userId);

  return prisma.order.update({
    where: { id },
    data: {
      userId: orderData.userId,
      orderDate: orderData.orderDate,
      status: orderData.status ?? null,
      totalAmount: orderData.totalAmount ?? null,
    },
    include: orderRelations,
  });
}

async function deleteOrder(id) {
  const existingOrder = await prisma.order.findUnique({ where: { id } });

  if (!existingOrder) {
    return null;
  }

  return prisma.order.delete({ where: { id } });
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};
