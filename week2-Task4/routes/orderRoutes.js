const express = require("express");

const orderController = require("../controllers/orderController");
const validateOrder = require("../middleware/validateOrder");

const router = express.Router();

router.get("/orders", orderController.getAllOrders);
router.get("/orders/:id", orderController.getOrderById);
router.post("/orders", validateOrder, orderController.createOrder);
router.put("/orders/:id", validateOrder, orderController.updateOrder);
router.delete("/orders/:id", orderController.deleteOrder);

module.exports = router;
