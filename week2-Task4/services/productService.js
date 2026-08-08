const prisma = require("../config/prisma");

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
  return prisma.product.create({
    data: {
      productName: productData.productName,
      description: productData.description ?? null,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
    },
  });
}

async function updateProduct(id, productData) {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    return null;
  }

  return prisma.product.update({
    where: { id },
    data: {
      productName: productData.productName,
      description: productData.description ?? null,
      price: productData.price,
      stockQuantity: productData.stockQuantity,
    },
  });
}

async function deleteProduct(id) {
  const existingProduct = await prisma.product.findUnique({ where: { id } });

  if (!existingProduct) {
    return null;
  }

  return prisma.product.delete({ where: { id } });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
