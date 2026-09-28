const express = require("express");

const authController = require("../controllers/authController");
const { validateLogin, validateRegister } = require("../middleware/validateAuth");
const { loginLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", validateRegister, authController.register);
router.post("/login", loginLimiter, validateLogin, authController.login);

module.exports = router;
