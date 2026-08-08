const express = require("express");

const userController = require("../controllers/userController");
const validateUser = require("../middleware/validateUser");

const router = express.Router();

router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.post("/users", validateUser, userController.createUser);
router.put("/users/:id", validateUser, userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

module.exports = router;
