import { Router } from "express";
import {
  createSchema,
  updateSchema,
  idSchema,
  querySchema,
  validate,
  requireJson,
} from "./task.validation.js";
import * as controller from "./task.controller.js";

export const taskRouter = Router();

taskRouter.get("/", validate(querySchema, "query"), controller.listTasks);
taskRouter.post(
  "/",
  requireJson,
  validate(createSchema, "body"),
  controller.createTask,
);
taskRouter.get("/:id", validate(idSchema, "params"), controller.getTask);
taskRouter.patch(
  "/:id",
  requireJson,
  validate(idSchema, "params"),
  validate(updateSchema, "body"),
  controller.updateTask,
);
taskRouter.delete("/:id", validate(idSchema, "params"), controller.deleteTask);
