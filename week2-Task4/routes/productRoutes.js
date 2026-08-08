const express = require("express");

const productController = require("../controllers/productController");
const validateProduct = require("../middleware/validateProduct");

const router = express.Router();

router.get("/products", productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.post("/products", validateProduct, productController.createProduct);
router.put("/products/:id", validateProduct, productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

module.exports = router;
