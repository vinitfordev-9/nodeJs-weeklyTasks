import * as service from './notification.service.js';
import { RESPONSES, sendResponse } from '../common/responses.js';
export async function list(req, res) { return sendResponse(res, RESPONSES.NOTIFICATIONS, { data: await service.list(req.user.id) }); }
export async function read(req, res) { return sendResponse(res, RESPONSES.NOTIFICATION_READ, { data: await service.read(req.validated.params.id, req.user.id) }); }
