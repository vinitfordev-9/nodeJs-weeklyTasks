const orderItemService = require("../services/orderItemService");

function parseOrderItemId(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({
      message: "Order item ID must be a positive integer",
    });
    return null;
  }

  return id;
}

async function getAllOrderItems(req, res, next) {
  try {
    const orderItems = await orderItemService.getAllOrderItems();
    res.status(200).json(orderItems);
  } catch (error) {
    next(error);
  }
}

async function getOrderItemById(req, res, next) {
  try {
    const id = parseOrderItemId(req, res);
    if (id === null) return;

    const orderItem = await orderItemService.getOrderItemById(id);

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.status(200).json(orderItem);
  } catch (error) {
    next(error);
  }
}

async function createOrderItem(req, res, next) {
  try {
    const orderItem = await orderItemService.createOrderItem(req.body);
    res.status(201).json(orderItem);
  } catch (error) {
    next(error);
  }
}

async function updateOrderItem(req, res, next) {
  try {
    const id = parseOrderItemId(req, res);
    if (id === null) return;

    const orderItem = await orderItemService.updateOrderItem(id, req.body);

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.status(200).json(orderItem);
  } catch (error) {
    next(error);
  }
}

async function deleteOrderItem(req, res, next) {
  try {
    const id = parseOrderItemId(req, res);
    if (id === null) return;

    const orderItem = await orderItemService.deleteOrderItem(id);

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }

    res.status(200).json({
      message: "Order item deleted successfully",
      deletedOrderItem: orderItem,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
