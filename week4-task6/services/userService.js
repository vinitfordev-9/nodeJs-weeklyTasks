const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const { PUBLIC_USER_FIELDS } = require("../config/prismaSelects");

async function getAllUsers() {
  // return prisma.user.findMany({
  //   include: {
  //     orders: true,
  //   },
  // });
  return prisma.user.findMany({ select: PUBLIC_USER_FIELDS });
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      ...PUBLIC_USER_FIELDS,
      orders: true,
    },
  });
}

async function createUser(userData) {
  const passwordHash = await bcrypt.hash(userData.password, 12);

  return prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: passwordHash,
      role: userData.role,
      phone: userData.phone ?? null,
      address: userData.address ?? null,
    },
    select: PUBLIC_USER_FIELDS,
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

  const data = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    phone: userData.phone ?? null,
    address: userData.address ?? null,
  };

  if (userData.password) {
    data.password = await bcrypt.hash(userData.password, 12);
  }

  return prisma.user.update({
    where: {
      id,
    },
    data,
    select: PUBLIC_USER_FIELDS,
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
    select: PUBLIC_USER_FIELDS,
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
