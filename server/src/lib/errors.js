// Every error the API returns has the shape: { error: { code, message, details? } }
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg, details) => new ApiError(400, 'BAD_REQUEST', msg, details);
export const unauthorized = (msg = 'Please log in') => new ApiError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'You do not have access to this action') => new ApiError(403, 'FORBIDDEN', msg);
export const notFound = (what = 'Resource') => new ApiError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (msg) => new ApiError(409, 'CONFLICT', msg);
export const notImplemented = (owner) =>
  new ApiError(501, 'NOT_IMPLEMENTED', `Not implemented yet${owner ? ` (owner: ${owner})` : ''}`);

// Wrap async controllers so thrown errors reach the error middleware.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
