const express = require("express");
const controller = require("../controllers/orderController");
const validateOrder = require("../middleware/validateOrder");
const router = express.Router();

router.get("/orders", controller.getAllOrders);
router.get("/orders/:id", controller.getOrderById);
router.post("/orders", validateOrder, controller.createOrder);
router.put("/orders/:id", validateOrder, controller.updateOrder);
router.delete("/orders/:id", controller.deleteOrder);

module.exports = router;
