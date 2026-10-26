import { AppError, RESPONSES, sendResponse } from '../common/responses.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let response = RESPONSES.INTERNAL;
  let errors = [];
  if (error instanceof AppError) {
    response = error.response;
    errors = error.details;
  } else if (error.type === 'entity.parse.failed') response = RESPONSES.INVALID_JSON;
  else if (error.type === 'entity.too.large') response = RESPONSES.TOO_LARGE;
  else if (error.status === 415) response = RESPONSES.CONTENT_TYPE;
  else if (error.code === 'P2025') response = RESPONSES.NOT_FOUND;
  else if (error.code === 'P2002') response = RESPONSES.CONFLICT;
  else if (['P1001', 'P1002', 'P1017', 'P2024', 'ECONNREFUSED'].includes(error.code)) response = RESPONSES.UNAVAILABLE;
  if (response.status >= 500) console.error('Request failed:', error);
  return sendResponse(res, response, { errors });
}
