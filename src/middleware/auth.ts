import type { Request, Response, NextFunction } from 'express';
import { verifySession, verifyUserSession } from '../lib/token';
import { config } from '../config';
import { AppError } from '../utils/AppError';

/**
 * Reads the session cookie, verifies the JWT, and attaches the admin to the
 * request (and to res.locals for the views). Invalid/expired tokens are cleared
 * and the request simply continues as anonymous — no error is thrown here.
 */
export function attachUser(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.sessionCookieName];
  if (token) {
    const payload = verifySession(token);
    if (payload) {
      req.user = payload;
      res.locals.currentUser = { id: payload.sub, email: payload.email, role: payload.role };
    } else {
      // Stale/invalid token — clear it so the browser stops resending.
      res.clearCookie(config.sessionCookieName, { path: '/' });
    }
  }
  next();
}

/**
 * Guards admin-only routes. Browser navigations are redirected to the login
 * page (preserving where they were headed); API/fetch callers get a 401.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user && req.user.role === 'ADMIN') {
    next();
    return;
  }

  const wantsJson =
    req.xhr || req.headers.accept?.includes('application/json');
  if (wantsJson) {
    next(AppError.unauthorized());
    return;
  }

  const nextParam = encodeURIComponent(req.originalUrl);
  res.redirect(`/auth/login?next=${nextParam}`);
}

/** Attaches the fantasy user (if any) from the user session cookie. */
export function attachFantasyUser(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[config.userCookieName];
  if (token) {
    const payload = verifyUserSession(token);
    if (payload) {
      req.fantasyUser = payload;
      res.locals.fantasyUser = { id: payload.sub, email: payload.email, name: payload.name };
    } else {
      res.clearCookie(config.userCookieName, { path: '/' });
    }
  }
  next();
}

/** Guards fantasy routes: redirects browsers to the user login, 401 for fetch. */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  if (req.fantasyUser) {
    next();
    return;
  }
  const wantsJson = req.xhr || req.headers.accept?.includes('application/json');
  if (wantsJson) {
    next(AppError.unauthorized());
    return;
  }
  res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
}
