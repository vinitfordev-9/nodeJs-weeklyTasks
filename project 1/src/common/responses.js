// All public response codes, HTTP statuses, and messages live here.
export const RESPONSES = Object.freeze({
  HEALTHY: { status: 200, code: 'SERVICE_HEALTHY', message: 'The task manager service is ready.' },
  CREATED: { status: 201, code: 'TASK_CREATED', message: 'Your task was created successfully.' },
  LISTED: { status: 200, code: 'TASKS_RETRIEVED', message: 'Your tasks were retrieved successfully.' },
  RETRIEVED: { status: 200, code: 'TASK_RETRIEVED', message: 'Your task was retrieved successfully.' },
  UPDATED: { status: 200, code: 'TASK_UPDATED', message: 'Your task was updated successfully.' },
  DELETED: { status: 200, code: 'TASK_DELETED', message: 'Your task was deleted successfully.' },
  VALIDATION: { status: 400, code: 'VALIDATION_ERROR', message: 'Please correct the highlighted fields and try again.' },
  INVALID_JSON: { status: 400, code: 'INVALID_JSON', message: 'The request body is not valid JSON. Please check its format.' },
  NOT_FOUND: { status: 404, code: 'TASK_NOT_FOUND', message: 'This task could not be found. Please check the task ID.' },
  ROUTE_NOT_FOUND: { status: 404, code: 'ROUTE_NOT_FOUND', message: 'This endpoint does not exist. Please check the URL and HTTP method.' },
  CONTENT_TYPE: { status: 415, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Please send the request body as application/json.' },
  TOO_LARGE: { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Your request is too large. Please keep it below 32 KB.' },
  CONFLICT: { status: 409, code: 'RESOURCE_CONFLICT', message: 'This change conflicts with an existing record. Please review your request.' },
  UNAVAILABLE: { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable. Please try again shortly.' },
  INTERNAL: { status: 500, code: 'INTERNAL_ERROR', message: 'We could not complete your request. Please try again later.' },
});

export class AppError extends Error {
  constructor(response, details = []) {
    super(response.message);
    this.response = response;
    this.details = details;
  }
}

export function sendResponse(res, response, { data = null, errors = [], meta = null } = {}) {
  return res.status(response.status).json({
    success: response.status < 400,
    code: response.code,
    message: response.message,
    data,
    errors,
    meta,
  });
}
