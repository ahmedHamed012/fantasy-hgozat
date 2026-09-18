import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { config } from '../config';
import { createTranslator, DEFAULT_LOCALE, LOCALE_DIR, isLocale } from '../i18n';

/**
 * Central error handler. Operational (AppError) failures render a friendly
 * message with the right status code. Unexpected errors are logged in full but
 * shown to the user as a generic 500 — stack traces are never leaked in
 * production.
 *
 * Content negotiation: AJAX/fetch callers (the live-match screen) get JSON;
 * ordinary page requests get a rendered error page.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : 'Something went wrong. Please try again.';

  if (!isAppError || statusCode >= 500) {
    logger.error('Unhandled error', {
      path: req.originalUrl,
      method: req.method,
      error: err instanceof Error ? err.message : String(err),
      stack: !config.isProduction && err instanceof Error ? err.stack : undefined,
    });
  }

  const wantsJson =
    req.xhr ||
    req.headers.accept?.includes('application/json') ||
    req.headers['content-type']?.includes('application/json');

  if (wantsJson) {
    res.status(statusCode).json({ error: message });
    return;
  }

  // Guarantee i18n locals exist even if the error fired before/inside the
  // locale middleware, so the error page always renders.
  if (typeof res.locals.t !== 'function') {
    const locale = isLocale(res.locals.locale) ? res.locals.locale : DEFAULT_LOCALE;
    res.locals.locale = locale;
    res.locals.dir = LOCALE_DIR[locale];
    res.locals.t = createTranslator(locale);
    res.locals.otherLocale = locale === 'en' ? 'ar' : 'en';
    res.locals.currentPath ??= req.path;
    res.locals.currentYear ??= new Date().getFullYear();
    res.locals.currentUser ??= null;
  }

  res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message,
  });
}
