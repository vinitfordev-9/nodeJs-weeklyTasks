const orderItemService = require("../services/orderItemService");
const { parsePositiveId } = require("../middleware/parsePositiveId");

async function getAllOrderItems(req, res, next) {
  try { return res.status(200).json(await orderItemService.getAllOrderItems()); } catch (error) { return next(error); }
}

async function getOrderItemById(req, res, next) {
  try {
    const item = await orderItemService.getOrderItemById(parsePositiveId(req.params.id, "Order item"));
    if (!item) return res.status(404).json({ message: "Order item not found" });
    return res.status(200).json(item);
  } catch (error) { return next(error); }
}

async function createOrderItem(req, res, next) {
  try { return res.status(201).json(await orderItemService.createOrderItem(req.body)); } catch (error) { return next(error); }
}

async function updateOrderItem(req, res, next) {
  try {
    const item = await orderItemService.updateOrderItem(parsePositiveId(req.params.id, "Order item"), req.body);
    if (!item) return res.status(404).json({ message: "Order item not found" });
    return res.status(200).json(item);
  } catch (error) { return next(error); }
}

async function deleteOrderItem(req, res, next) {
  try {
    const item = await orderItemService.deleteOrderItem(parsePositiveId(req.params.id, "Order item"));
    if (!item) return res.status(404).json({ message: "Order item not found" });
    return res.status(200).json({ message: "Order item deleted successfully", deletedOrderItem: item });
  } catch (error) { return next(error); }
}

module.exports = { getAllOrderItems, getOrderItemById, createOrderItem, updateOrderItem, deleteOrderItem };
