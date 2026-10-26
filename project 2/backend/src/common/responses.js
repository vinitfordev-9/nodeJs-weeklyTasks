// One source of truth for HTTP statuses, public codes, and user-facing messages.
const definition = (status, code, message) =>
  Object.freeze({ status, code, message });
export const RESPONSES = Object.freeze({
  HEALTHY: definition(200, "SERVICE_HEALTHY", "The job board is ready."),
  REGISTERED: definition(
    201,
    "ACCOUNT_CREATED",
    "Your account is ready. Welcome aboard.",
  ),
  LOGGED_IN: definition(
    200,
    "LOGIN_SUCCESS",
    "You have signed in successfully.",
  ),
  LOGGED_OUT: definition(
    200,
    "LOGOUT_SUCCESS",
    "You have signed out successfully.",
  ),
  PROFILE: definition(
    200,
    "PROFILE_RETRIEVED",
    "Your profile was retrieved successfully.",
  ),
  JOB_CREATED: definition(
    201,
    "JOB_CREATED",
    "Your job has been published successfully.",
  ),
  JOBS: definition(200, "JOBS_RETRIEVED", "Jobs were retrieved successfully."),
  JOB: definition(
    200,
    "JOB_RETRIEVED",
    "Job details were retrieved successfully.",
  ),
  JOB_UPDATED: definition(
    200,
    "JOB_UPDATED",
    "Your job has been updated successfully.",
  ),
  JOB_DELETED: definition(
    200,
    "JOB_DELETED",
    "Your job and its applications have been deleted.",
  ),
  APPLIED: definition(
    201,
    "APPLICATION_SUBMITTED",
    "Your application has been sent. Good luck!",
  ),
  APPLICATIONS: definition(
    200,
    "APPLICATIONS_RETRIEVED",
    "Applications were retrieved successfully.",
  ),
  APPLICATION_UPDATED: definition(
    200,
    "APPLICATION_UPDATED",
    "The application status has been updated.",
  ),
  VALIDATION: definition(
    400,
    "VALIDATION_ERROR",
    "Please correct the highlighted fields and try again.",
  ),
  JSON: definition(
    400,
    "INVALID_JSON",
    "The request body is not valid JSON. Please check its format.",
  ),
  UNAUTHORIZED: definition(
    401,
    "AUTHENTICATION_REQUIRED",
    "Please sign in to continue. Your session may have expired.",
  ),
  CREDENTIALS: definition(
    401,
    "INVALID_CREDENTIALS",
    "The email or password is incorrect.",
  ),
  FORBIDDEN: definition(
    403,
    "ACCESS_DENIED",
    "Your account does not have permission to perform this action.",
  ),
  NOT_FOUND: definition(
    404,
    "RESOURCE_NOT_FOUND",
    "The requested record could not be found.",
  ),
  ROUTE: definition(
    404,
    "ROUTE_NOT_FOUND",
    "This endpoint does not exist. Check the URL and HTTP method.",
  ),
  DUPLICATE: definition(
    409,
    "ALREADY_APPLIED",
    "You have already applied to this job. View it in My applications.",
  ),
  EMAIL_EXISTS: definition(
    409,
    "EMAIL_IN_USE",
    "An account with this email already exists. Please sign in.",
  ),
  CLOSED: definition(
    409,
    "JOB_CLOSED",
    "This job is no longer accepting applications.",
  ),
  CONFLICT: definition(
    409,
    "RESOURCE_CONFLICT",
    "This record changed. Please refresh and try again.",
  ),
  UPLOAD: definition(
    400,
    "INVALID_RESUME",
    "Please upload one PDF resume using the resume field.",
  ),
  TOO_LARGE: definition(
    413,
    "PAYLOAD_TOO_LARGE",
    "The file or request is too large. Resumes must be 5 MB or smaller.",
  ),
  CONTENT: definition(
    415,
    "UNSUPPORTED_MEDIA_TYPE",
    "Use application/json for JSON requests or multipart/form-data for applications.",
  ),
  RATE: definition(
    429,
    "TOO_MANY_REQUESTS",
    "Too many attempts. Please wait a few minutes and try again.",
  ),
  UNAVAILABLE: definition(
    503,
    "SERVICE_UNAVAILABLE",
    "The service is temporarily unavailable. Please try again shortly.",
  ),
  INTERNAL: definition(
    500,
    "INTERNAL_ERROR",
    "We could not complete your request. Please try again later.",
  ),
});
export class AppError extends Error {
  constructor(response, details = []) {
    super(response.message);
    this.response = response;
    this.details = details;
  }
}
export function sendResponse(
  res,
  response,
  { data = null, errors = [], meta = null } = {},
) {
  return res.status(response.status).json({
    success: response.status < 400,
    code: response.code,
    message: response.message,
    data,
    errors,
    meta,
  });
}
export function pagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}
