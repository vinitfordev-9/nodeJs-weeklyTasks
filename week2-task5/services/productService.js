const { Product, OrderItem } = require("../models");

const productAssociation = { model: OrderItem, as: "orderItems" };

async function getAllProducts() {
  return Product.findAll({ include: [productAssociation], order: [["id", "ASC"]] });
}

async function getProductById(id) {
  return Product.findByPk(id, { include: [productAssociation] });
}

async function createProduct(productData) {
  return Product.create({
    productName: productData.productName,
    description: productData.description ?? null,
    price: productData.price,
    stockQuantity: productData.stockQuantity,
  });
}

async function updateProduct(id, productData) {
  const product = await Product.findByPk(id);
  if (!product) return null;

  await product.update({
    productName: productData.productName,
    description: productData.description ?? null,
    price: productData.price,
    stockQuantity: productData.stockQuantity,
  });
  return getProductById(id);
}

async function deleteProduct(id) {
  const product = await Product.findByPk(id);
  if (!product) return null;
  const deletedProduct = product.toJSON();
  await product.destroy();
  return deletedProduct;
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
