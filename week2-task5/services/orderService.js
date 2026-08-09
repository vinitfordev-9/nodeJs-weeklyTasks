const { User, Product, Order, OrderItem } = require("../models");

const orderAssociations = [
  { model: User, as: "user" },
  {
    model: OrderItem,
    as: "orderItems",
    include: [{ model: Product, as: "product" }],
  },
];

async function getAllOrders() {
  return Order.findAll({ include: orderAssociations, order: [["id", "ASC"]] });
}

async function getOrderById(id) {
  return Order.findByPk(id, { include: orderAssociations });
}

async function ensureUserExists(userId) {
  if (!(await User.findByPk(userId, { attributes: ["id"] }))) {
    const error = new Error("User not found");
    error.status = 400;
    throw error;
  }
}

async function createOrder(orderData) {
  await ensureUserExists(orderData.userId);
  const order = await Order.create({
    userId: orderData.userId,
    orderDate: orderData.orderDate,
    status: orderData.status ?? null,
    totalAmount: orderData.totalAmount ?? null,
  });
  return getOrderById(order.id);
}

async function updateOrder(id, orderData) {
  const order = await Order.findByPk(id);
  if (!order) return null;
  await ensureUserExists(orderData.userId);
  await order.update({
    userId: orderData.userId,
    orderDate: orderData.orderDate,
    status: orderData.status ?? null,
    totalAmount: orderData.totalAmount ?? null,
  });
  return getOrderById(id);
}

async function deleteOrder(id) {
  const order = await Order.findByPk(id);
  if (!order) return null;
  const deletedOrder = order.toJSON();
  await order.destroy();
  return deletedOrder;
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };
