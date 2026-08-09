const orderService = require("../services/orderService");
const { parsePositiveId } = require("../middleware/parsePositiveId");

async function getAllOrders(req, res, next) {
  try { return res.status(200).json(await orderService.getAllOrders()); } catch (error) { return next(error); }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(parsePositiveId(req.params.id, "Order"));
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(order);
  } catch (error) { return next(error); }
}

async function createOrder(req, res, next) {
  try { return res.status(201).json(await orderService.createOrder(req.body)); } catch (error) { return next(error); }
}

async function updateOrder(req, res, next) {
  try {
    const order = await orderService.updateOrder(parsePositiveId(req.params.id, "Order"), req.body);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json(order);
  } catch (error) { return next(error); }
}

async function deleteOrder(req, res, next) {
  try {
    const order = await orderService.deleteOrder(parsePositiveId(req.params.id, "Order"));
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.status(200).json({ message: "Order deleted successfully", deletedOrder: order });
  } catch (error) { return next(error); }
}

module.exports = { getAllOrders, getOrderById, createOrder, updateOrder, deleteOrder };
