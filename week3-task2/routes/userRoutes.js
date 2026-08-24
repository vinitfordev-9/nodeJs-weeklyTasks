const express = require("express");

const userController = require("../controllers/userController");
const {
  validateCreateUser,
  validateUpdateUser,
} = require("../middleware/validateUser");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

router.use(authorizeRoles("ADMIN"));

router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.post("/users", validateCreateUser, userController.createUser);
router.put("/users/:id", validateUpdateUser, userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;

//patch method implement
