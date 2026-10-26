import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { RESPONSES, sendResponse } from "../common/responses.js";
import { validate, requireJson } from "../common/validation.js";
import { authenticate } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as controller from "./auth.controller.js";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (req, res) => sendResponse(res, RESPONSES.RATE),
});
export const authRouter = Router();
authRouter.post(
  "/register",
  limiter,
  requireJson,
  validate(registerSchema),
  controller.register,
);
authRouter.post(
  "/login",
  limiter,
  requireJson,
  validate(loginSchema),
  controller.login,
);
authRouter.get("/me", authenticate, controller.me);
authRouter.post("/logout", authenticate, controller.logout);
