const express = require("express");

const orderItemController = require("../controllers/orderItemController");
const validateOrderItem = require("../middleware/validateOrderItem");

const router = express.Router();

router.get("/order-items", orderItemController.getAllOrderItems);
router.get("/order-items/:id", orderItemController.getOrderItemById);
router.post(
  "/order-items",
  validateOrderItem,
  orderItemController.createOrderItem,
);
router.put(
  "/order-items/:id",
  validateOrderItem,
  orderItemController.updateOrderItem,
);
router.delete("/order-items/:id", orderItemController.deleteOrderItem);

module.exports = router;
