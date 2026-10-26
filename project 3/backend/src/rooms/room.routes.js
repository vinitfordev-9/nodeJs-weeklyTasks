import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate, requireJson, idSchema } from "../common/validation.js";
import { roomSchema, roomQuery } from "./room.validation.js";
import {
  historySchema,
  messageSchema,
  readSchema,
} from "../messages/message.validation.js";
import * as controller from "./room.controller.js";
import * as messages from "../messages/message.controller.js";
export const roomRouter = Router();
roomRouter.use(authenticate);
roomRouter.get("/", validate(roomQuery, "query"), controller.list);
roomRouter.post("/", requireJson, validate(roomSchema), controller.create);
roomRouter.post("/:id/join", validate(idSchema, "params"), controller.join);
roomRouter.post("/:id/leave", validate(idSchema, "params"), controller.leave);
roomRouter.get(
  "/:id/members",
  validate(idSchema, "params"),
  controller.members,
);
roomRouter.get(
  "/:id/messages",
  validate(idSchema, "params"),
  validate(historySchema, "query"),
  messages.history,
);
roomRouter.post(
  "/:id/messages",
  validate(idSchema, "params"),
  requireJson,
  validate(messageSchema),
  messages.send,
);
roomRouter.post(
  "/:id/read",
  validate(idSchema, "params"),
  requireJson,
  validate(readSchema),
  messages.read,
);
