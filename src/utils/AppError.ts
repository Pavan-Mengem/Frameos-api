export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, details?: unknown) { return new AppError(400, msg, details); }
  static unauthorized(msg = 'Unauthorized') { return new AppError(401, msg); }
  static forbidden(msg = 'Forbidden') { return new AppError(403, msg); }
  static notFound(msg = 'Not found') { return new AppError(404, msg); }
  static conflict(msg = 'Conflict') { return new AppError(409, msg); }
  static tooMany(msg = 'Too many requests') { return new AppError(429, msg); }
}
