import * as service from './message.service.js';
import { RESPONSES, sendResponse } from '../common/responses.js';
export async function history(req, res) { return sendResponse(res, RESPONSES.MESSAGES, await service.history(req.validated.params.id, req.user.id, req.validated.query)); }
export async function send(req, res) { return sendResponse(res, RESPONSES.SENT, { data: await service.send(req.validated.params.id, req.user.id, req.validated.body) }); }
export async function read(req, res) { return sendResponse(res, RESPONSES.READ, { data: await service.markRead(req.validated.params.id, req.user.id, req.validated.body) }); }
