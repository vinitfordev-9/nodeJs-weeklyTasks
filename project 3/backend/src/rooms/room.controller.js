import * as service from "./room.service.js";
import { RESPONSES, sendResponse } from "../common/responses.js";
export async function list(req, res) {
  return sendResponse(
    res,
    RESPONSES.ROOMS,
    await service.list(req.user.id, req.validated.query),
  );
}
export async function create(req, res) {
  return sendResponse(res, RESPONSES.ROOM_CREATED, {
    data: await service.create(req.user.id, req.validated.body),
  });
}
export async function join(req, res) {
  return sendResponse(res, RESPONSES.JOINED, {
    data: await service.join(req.validated.params.id, req.user.id),
  });
}
export async function leave(req, res) {
  const data = await service.leave(
    req.validated.params.id,
    req.user.id,
    req.app.locals.io,
  );
  await req.app.locals.presence(data.roomId);
  return sendResponse(res, RESPONSES.LEFT, { data });
}
export async function members(req, res) {
  return sendResponse(res, RESPONSES.MEMBERS, {
    data: await service.members(req.validated.params.id, req.user.id),
  });
}
