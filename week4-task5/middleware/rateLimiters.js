const { rateLimit } = require("express-rate-limit");

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const loginLimiter = rateLimit({
  windowMs: positiveInteger(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000),
  limit: positiveInteger(process.env.LOGIN_RATE_LIMIT, 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts; please try again later",
  },
});

module.exports = { loginLimiter };
