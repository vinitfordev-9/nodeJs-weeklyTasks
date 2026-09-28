const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    if (!result) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, register };
