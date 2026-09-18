import { doubleCsrf } from 'csrf-csrf';
import { config } from '../config';

/**
 * CSRF protection via the double-submit-cookie pattern (csrf-csrf).
 *
 * A signed CSRF cookie is paired with a token embedded in each form / sent as
 * an `x-csrf-token` header by the live-match fetch calls. Stateless and
 * serverless-friendly — no server session store required.
 */
const {
  generateToken,
  doubleCsrfProtection,
  invalidCsrfTokenError,
} = doubleCsrf({
  getSecret: () => config.csrfSecret,
  // Stable across the anonymous→authenticated boundary. The double-submit
  // security comes from the signed, httpOnly per-browser cookie + secret; a
  // constant identifier keeps the token valid across login (tying it to the
  // auth cookie would invalidate tokens the moment a visitor signs in).
  getSessionIdentifier: () => 'footy-app',
  cookieName: config.isProduction ? '__Host-footy.x-csrf' : 'footy.x-csrf',
  cookieOptions: {
    sameSite: 'lax',
    secure: config.isProduction,
    httpOnly: true,
    path: '/',
  },
  getTokenFromRequest: (req) =>
    (req.headers['x-csrf-token'] as string | undefined) ??
    (req.body?._csrf as string | undefined),
});

/** Alias kept descriptive for call sites. */
export const generateCsrfToken = generateToken;
export { doubleCsrfProtection, invalidCsrfTokenError };

import type { Request, Response, NextFunction } from 'express';

/**
 * Exposes a fresh CSRF token to views (res.locals.csrfToken) on safe requests,
 * so every rendered form / page can embed it. Skipped for mutating methods,
 * which are validated by doubleCsrfProtection instead.
 */
export function provideCsrfToken(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.locals.csrfToken = generateToken(req, res);
  }
  next();
}

