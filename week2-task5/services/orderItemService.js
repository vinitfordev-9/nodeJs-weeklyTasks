const { User, Product, Order, OrderItem } = require("../models");

const orderItemAssociations = [
  {
    model: Order,
    as: "order",
    include: [{ model: User, as: "user" }],
  },
  { model: Product, as: "product" },
];

async function getAllOrderItems() {
  return OrderItem.findAll({ include: orderItemAssociations, order: [["id", "ASC"]] });
}

async function getOrderItemById(id) {
  return OrderItem.findByPk(id, { include: orderItemAssociations });
}

async function getRelatedRecords(orderId, productId) {
  const [order, product] = await Promise.all([
    Order.findByPk(orderId, { attributes: ["id"] }),
    Product.findByPk(productId, { attributes: ["id", "price"] }),
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
  const { product } = await getRelatedRecords(orderItemData.orderId, orderItemData.productId);
  const orderItem = await OrderItem.create({
    orderId: orderItemData.orderId,
    productId: orderItemData.productId,
    quantity: orderItemData.quantity,
    price: orderItemData.price ?? product.price,
  });
  return getOrderItemById(orderItem.id);
}

async function updateOrderItem(id, orderItemData) {
  const orderItem = await OrderItem.findByPk(id);
  if (!orderItem) return null;
  const { product } = await getRelatedRecords(orderItemData.orderId, orderItemData.productId);
  await orderItem.update({
    orderId: orderItemData.orderId,
    productId: orderItemData.productId,
    quantity: orderItemData.quantity,
    price: orderItemData.price ?? orderItem.price ?? product.price,
  });
  return getOrderItemById(id);
}

async function deleteOrderItem(id) {
  const orderItem = await OrderItem.findByPk(id);
  if (!orderItem) return null;
  const deletedOrderItem = orderItem.toJSON();
  await orderItem.destroy();
  return deletedOrderItem;
}

module.exports = {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
