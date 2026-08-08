const prisma = require("../config/prisma");

async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      orders: true,
    },
  });
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      orders: true,
    },
  });
}

async function createUser(userData) {
  return prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone ?? null,
      address: userData.address ?? null,
    },
  });
}

async function updateUser(id, userData) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    return null;
  }

  return prisma.user.update({
    where: {
      id,
    },
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone ?? null,
      address: userData.address ?? null,
    },
  });
}

async function deleteUser(id) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    return null;
  }

  return prisma.user.delete({
    where: {
      id,
    },
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
