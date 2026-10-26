import { RESPONSES, sendResponse } from "../common/responses.js";
import * as service from "./task.service.js";

export async function listTasks(req, res) {
  return sendResponse(
    res,
    RESPONSES.LISTED,
    await service.listTasks(req.validated.query),
  );
}

export async function createTask(req, res) {
  const data = await service.createTask(req.validated.body);
  res.location(`/api/tasks/${data.id}`);
  return sendResponse(res, RESPONSES.CREATED, { data });
}

export async function getTask(req, res) {
  return sendResponse(res, RESPONSES.RETRIEVED, {
    data: await service.getTask(req.validated.params.id),
  });
}

export async function updateTask(req, res) {
  return sendResponse(res, RESPONSES.UPDATED, {
    data: await service.updateTask(
      req.validated.params.id,
      req.validated.body,
    ),
  });
}

export async function deleteTask(req, res) {
  return sendResponse(res, RESPONSES.DELETED, {
    data: await service.deleteTask(req.validated.params.id),
  });
}
