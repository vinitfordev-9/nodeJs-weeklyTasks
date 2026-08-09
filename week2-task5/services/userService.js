const { User, Order } = require("../models");

const userAssociation = {
  model: Order,
  as: "orders",
};

async function getAllUsers() {
  return User.findAll({
    include: [userAssociation],
    order: [["id", "ASC"]],
  });
}

async function getUserById(id) {
  return User.findByPk(id, { include: [userAssociation] });
}

async function createUser(userData) {
  return User.create({
    name: userData.name,
    email: userData.email,
    phone: userData.phone ?? null,
    address: userData.address ?? null,
  });
}

async function updateUser(id, userData) {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.update({
    name: userData.name,
    email: userData.email,
    phone: userData.phone ?? null,
    address: userData.address ?? null,
  });
  return getUserById(id);
}

async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) return null;

  const deletedUser = user.toJSON();
  await user.destroy();
  return deletedUser;
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
