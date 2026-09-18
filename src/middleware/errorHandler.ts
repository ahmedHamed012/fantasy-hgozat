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

  // Honor a client-range statusCode from library errors (e.g. csrf-csrf's
  // 403 invalid-token error) without leaking their internal messages.
  const libStatus =
    !isAppError &&
    typeof err === 'object' &&
    err !== null &&
    typeof (err as { statusCode?: unknown }).statusCode === 'number'
      ? (err as { statusCode: number }).statusCode
      : undefined;

  const statusCode = isAppError
    ? err.statusCode
    : libStatus && libStatus >= 400 && libStatus < 500
      ? libStatus
      : 500;

  let message: string;
  if (isAppError) {
    message = err.message;
  } else if (statusCode === 403) {
    message = 'Your session expired or the form was invalid. Please try again.';
  } else if (statusCode >= 400 && statusCode < 500) {
    message = 'Invalid request.';
  } else {
    message = 'Something went wrong. Please try again.';
  }

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
  }

  // Always ensure view globals — an error can fire after i18n is set but before
  // the view-globals middleware runs (e.g. inside CSRF handling).
  res.locals.currentPath ??= req.path;
  res.locals.currentYear ??= new Date().getFullYear();
  if (res.locals.currentUser === undefined) res.locals.currentUser = null;
  if (res.locals.fantasyUser === undefined) res.locals.fantasyUser = null;
  res.locals.csrfToken ??= '';

  res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    statusCode,
    message,
  });
}
