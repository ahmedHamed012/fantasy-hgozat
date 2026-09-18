/**
 * Application-level error carrying an HTTP status code and a user-safe message.
 *
 * Thrown anywhere in the request lifecycle (services, controllers, middleware)
 * and translated into a friendly response by the central error handler.
 * Anything that is NOT an AppError is treated as an unexpected 500 and its
 * details are never leaked to the client in production.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  /** Marks errors that are safe to show to end users. */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'You must be logged in to do that.'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'You are not allowed to do that.'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Not found.'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }
}
