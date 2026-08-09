const express = require("express");
const controller = require("../controllers/orderItemController");
const validateOrderItem = require("../middleware/validateOrderItem");
const router = express.Router();

router.get("/order-items", controller.getAllOrderItems);
router.get("/order-items/:id", controller.getOrderItemById);
router.post("/order-items", validateOrderItem, controller.createOrderItem);
router.put("/order-items/:id", validateOrderItem, controller.updateOrderItem);
router.delete("/order-items/:id", controller.deleteOrderItem);

module.exports = router;
