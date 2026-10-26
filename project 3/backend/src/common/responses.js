const response = (status, code, message) => Object.freeze({ status, code, message });
export const RESPONSES = Object.freeze({
  HEALTHY: response(200, 'SERVICE_HEALTHY', 'The chat service is ready.'),
  REGISTERED: response(201, 'ACCOUNT_CREATED', 'Your account is ready. Welcome to Commonroom.'),
  LOGGED_IN: response(200, 'LOGIN_SUCCESS', 'You have signed in successfully.'),
  LOGGED_OUT: response(200, 'LOGOUT_SUCCESS', 'You have signed out successfully.'),
  PROFILE: response(200, 'PROFILE_RETRIEVED', 'Your profile was retrieved successfully.'),
  ROOMS: response(200, 'ROOMS_RETRIEVED', 'Rooms were retrieved successfully.'),
  ROOM_CREATED: response(201, 'ROOM_CREATED', 'Your room is ready. Start a conversation.'),
  JOINED: response(200, 'ROOM_JOINED', 'You have joined the room.'),
  LEFT: response(200, 'ROOM_LEFT', 'You have left the room.'),
  MEMBERS: response(200, 'MEMBERS_RETRIEVED', 'Room members were retrieved successfully.'),
  MESSAGES: response(200, 'MESSAGES_RETRIEVED', 'Message history was retrieved successfully.'),
  SENT: response(201, 'MESSAGE_SAVED', 'Your message was saved successfully.'),
  READ: response(200, 'MESSAGES_READ', 'Read receipts were saved successfully.'),
  TYPING: response(200, 'TYPING_UPDATED', 'Typing status was updated.'),
  PRESENCE: response(200, 'PRESENCE_RETRIEVED', 'Online room members were retrieved successfully.'),
  NOTIFICATIONS: response(200, 'NOTIFICATIONS_RETRIEVED', 'Your mentions were retrieved successfully.'),
  NOTIFICATION_READ: response(200, 'NOTIFICATION_READ', 'This mention was marked as read.'),
  VALIDATION: response(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields and try again.'),
  JSON: response(400, 'INVALID_JSON', 'The request body is not valid JSON.'),
  UNAUTHORIZED: response(401, 'AUTHENTICATION_REQUIRED', 'Please sign in to continue. Your session may have expired.'),
  CREDENTIALS: response(401, 'INVALID_CREDENTIALS', 'The email or password is incorrect.'),
  FORBIDDEN: response(403, 'ROOM_ACCESS_DENIED', 'Join this room before reading or sending messages.'),
  NOT_FOUND: response(404, 'RESOURCE_NOT_FOUND', 'The requested record could not be found.'),
  ROUTE: response(404, 'ROUTE_NOT_FOUND', 'This endpoint does not exist. Check the URL and method.'),
  EMAIL_EXISTS: response(409, 'ACCOUNT_IN_USE', 'This email or handle is already registered. Please sign in or choose another.'),
  CONFLICT: response(409, 'RESOURCE_CONFLICT', 'This name or message identifier is already in use. Please review your request.'),
  CONTENT: response(415, 'UNSUPPORTED_MEDIA_TYPE', 'Please send the request body as application/json.'),
  TOO_LARGE: response(413, 'PAYLOAD_TOO_LARGE', 'Your request is too large. Messages must be 4,000 characters or fewer.'),
  RATE: response(429, 'TOO_MANY_REQUESTS', 'You are sending too quickly. Please wait a moment and try again.'),
  UNAVAILABLE: response(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please try again shortly.'),
  INTERNAL: response(500, 'INTERNAL_ERROR', 'We could not complete your request. Please try again later.'),
});
export class AppError extends Error { constructor(response, details = []) { super(response.message); this.response = response; this.details = details; } }
export const jsonSafe = value => JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
export function envelope(response, { data = null, errors = [], meta = null } = {}) { return jsonSafe({ success: response.status < 400, code: response.code, message: response.message, data, errors, meta }); }
export function sendResponse(res, response, options) { return res.status(response.status).json(envelope(response, options)); }
export function errorResponse(error) {
  if (error instanceof AppError) return { response: error.response, errors: error.details };
  let response = RESPONSES.INTERNAL;
  if (error.type === 'entity.parse.failed') response = RESPONSES.JSON;
  else if (error.type === 'entity.too.large') response = RESPONSES.TOO_LARGE;
  else if (error.status === 415) response = RESPONSES.CONTENT;
  else if (error.code === 'P2025') response = RESPONSES.NOT_FOUND;
  else if (['P2002', 'P2003', 'P2034'].includes(error.code)) response = RESPONSES.CONFLICT;
  else if (['P1001', 'P1002', 'P1017', 'P2024', 'ECONNREFUSED'].includes(error.code)) response = RESPONSES.UNAVAILABLE;
  if (response.status >= 500) console.error('Request failed:', error);
  return { response, errors: [] };
}
