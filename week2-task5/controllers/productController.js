const productService = require("../services/productService");
const { parsePositiveId } = require("../middleware/parsePositiveId");

async function getAllProducts(req, res, next) {
  try { return res.status(200).json(await productService.getAllProducts()); } catch (error) { return next(error); }
}

async function getProductById(req, res, next) {
  try {
    const product = await productService.getProductById(parsePositiveId(req.params.id, "Product"));
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  } catch (error) { return next(error); }
}

async function createProduct(req, res, next) {
  try { return res.status(201).json(await productService.createProduct(req.body)); } catch (error) { return next(error); }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productService.updateProduct(parsePositiveId(req.params.id, "Product"), req.body);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json(product);
  } catch (error) { return next(error); }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await productService.deleteProduct(parsePositiveId(req.params.id, "Product"));
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ message: "Product deleted successfully", deletedProduct: product });
  } catch (error) { return next(error); }
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
