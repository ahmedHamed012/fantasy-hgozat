import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/** Turns any unmatched route into a 404 AppError handled by errorHandler. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Page not found: ${req.originalUrl}`));
}
