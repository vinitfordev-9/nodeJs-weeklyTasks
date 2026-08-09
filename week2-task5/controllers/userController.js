const userService = require("../services/userService");
const { parsePositiveId } = require("../middleware/parsePositiveId");

async function getAllUsers(req, res, next) {
  try {
    res.status(200).json(await userService.getAllUsers());
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const id = parsePositiveId(req.params.id, "User");
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    return res.status(201).json(await userService.createUser(req.body));
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = parsePositiveId(req.params.id, "User");
    const user = await userService.updateUser(id, req.body);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = parsePositiveId(req.params.id, "User");
    const user = await userService.deleteUser(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({
      message: "User deleted successfully",
      deletedUser: user,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
