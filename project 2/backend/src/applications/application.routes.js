import { Router } from "express";
import { authenticate, allowRole } from "../middleware/auth.js";
import {
  validate,
  requireJson,
  idSchema,
  pageSchema,
} from "../common/validation.js";
import { statusSchema } from "./application.validation.js";
import * as controller from "./application.controller.js";
export const applicationRouter = Router();
applicationRouter.get(
  "/me",
  authenticate,
  allowRole("candidate"),
  validate(pageSchema, "query"),
  controller.mine,
);
applicationRouter.get(
  "/:id/resume",
  authenticate,
  validate(idSchema, "params"),
  controller.download,
);
applicationRouter.patch(
  "/:id/status",
  authenticate,
  allowRole("company"),
  validate(idSchema, "params"),
  requireJson,
  validate(statusSchema),
  controller.update,
);
