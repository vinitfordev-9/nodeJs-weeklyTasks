import { errorResponse, sendResponse } from '../common/responses.js';
export function errorHandler(error, req, res, next) { if (res.headersSent) return next(error); const { response, errors } = errorResponse(error); return sendResponse(res, response, { errors }); }
