const express = require("express");

const userController = require("../controllers/userController");
const {
  validateCreateUser,
  validateUpdateUser,
} = require("../middleware/validateUser");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.get("/users", authorizeRoles("ADMIN"), userController.getAllUsers);
router.get("/users/:id", authorizeRoles("ADMIN"), userController.getUserById);
router.post(
  "/users",
  authorizeRoles("ADMIN"),
  validateCreateUser,
  userController.createUser,
);
router.put(
  "/users/:id",
  authorizeRoles("ADMIN"),
  validateUpdateUser,
  userController.updateUser,
);
router.delete(
  "/users/:id",
  authorizeRoles("ADMIN"),
  userController.deleteUser,
);

module.exports = router;

//patch method implement
