const express = require("express");

const productController = require("../controllers/productController");
const validateProduct = require("../middleware/validateProduct");
const authorizeRoles = require("../middleware/authorizeRoles");
const cacheProducts = require("../middleware/cacheProducts");

const router = express.Router();

router.get("/products", cacheProducts, productController.getAllProducts);
router.get("/products/:id", productController.getProductById);
router.post(
  "/products",
  authorizeRoles("ADMIN"),
  validateProduct,
  productController.createProduct,
);
router.put(
  "/products/:id",
  authorizeRoles("ADMIN"),
  validateProduct,
  productController.updateProduct,
);
router.delete(
  "/products/:id",
  authorizeRoles("ADMIN"),
  productController.deleteProduct,
);

module.exports = router;
