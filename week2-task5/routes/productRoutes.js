const express = require("express");
const controller = require("../controllers/productController");
const validateProduct = require("../middleware/validateProduct");
const router = express.Router();

router.get("/products", controller.getAllProducts);
router.get("/products/:id", controller.getProductById);
router.post("/products", validateProduct, controller.createProduct);
router.put("/products/:id", validateProduct, controller.updateProduct);
router.delete("/products/:id", controller.deleteProduct);

module.exports = router;
