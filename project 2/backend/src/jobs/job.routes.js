import { Router } from "express";
import { authenticate, allowRole } from "../middleware/auth.js";
import { uploadResume, requirePdf } from "../middleware/upload.js";
import {
  validate,
  requireJson,
  idSchema,
  pageSchema,
} from "../common/validation.js";
import {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
} from "./job.validation.js";
import { applicationSchema } from "../applications/application.validation.js";
import * as controller from "./job.controller.js";
import * as applications from "../applications/application.controller.js";
export const jobRouter = Router();
jobRouter.get("/", validate(jobQuerySchema, "query"), controller.list);
jobRouter.post(
  "/",
  authenticate,
  allowRole("company"),
  requireJson,
  validate(createJobSchema),
  controller.create,
);
jobRouter.get("/:id", validate(idSchema, "params"), controller.get);
jobRouter.patch(
  "/:id",
  authenticate,
  allowRole("company"),
  validate(idSchema, "params"),
  requireJson,
  validate(updateJobSchema),
  controller.update,
);
jobRouter.delete(
  "/:id",
  authenticate,
  allowRole("company"),
  validate(idSchema, "params"),
  controller.remove,
);
jobRouter.post(
  "/:id/applications",
  authenticate,
  allowRole("candidate"),
  validate(idSchema, "params"),
  uploadResume,
  requirePdf,
  validate(applicationSchema),
  applications.apply,
);
jobRouter.get(
  "/:id/applications",
  authenticate,
  allowRole("company"),
  validate(idSchema, "params"),
  validate(pageSchema, "query"),
  applications.applicants,
);
export const companyRouter = Router();
companyRouter.get(
  "/jobs",
  authenticate,
  allowRole("company"),
  validate(pageSchema, "query"),
  controller.mine,
);
