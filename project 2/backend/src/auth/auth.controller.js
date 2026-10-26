import * as service from './auth.service.js';
import { RESPONSES, sendResponse } from '../common/responses.js';
export async function register(req, res) { return sendResponse(res, RESPONSES.REGISTERED, { data: await service.register(req.validated.body) }); }
export async function login(req, res) { return sendResponse(res, RESPONSES.LOGGED_IN, { data: await service.login(req.validated.body) }); }
export async function logout(req, res) { await service.logout(req.sessionId); return sendResponse(res, RESPONSES.LOGGED_OUT); }
export function me(req, res) { return sendResponse(res, RESPONSES.PROFILE, { data: req.user }); }
