const prisma = require("../config/prisma");
const productCache = require("./productCache");

async function getAllProducts() {
  return prisma.product.findMany({
    include: {
      orderItems: true,
    },
  });
}

async function getProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      orderItems: true,
    },
  });
}

async function createProduct(productData) {
  const product = await prisma.product.create({
    data: {
      productName: productData.productName,
      description: productData.description ?? null,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
    },
  });
  await productCache.invalidateProducts();
  return product;
}

async function updateProduct(id, productData) {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    return null;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      productName: productData.productName,
      description: productData.description ?? null,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
    },
  });
  await productCache.invalidateProducts();
  return product;
}

async function deleteProduct(id) {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    return null;
  }

  const product = await prisma.product.delete({ where: { id } });
  await productCache.invalidateProducts();
  return product;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
