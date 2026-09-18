import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { config } from '../config';
import { logger } from '../utils/logger';

const loginSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

/** Returns a safe, same-site relative path from the `next` query, else /admin. */
function safeNext(next: unknown): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/admin';
}

export function showLogin(req: Request, res: Response): void {
  // Already logged in → go straight to the admin area.
  if (req.user) {
    res.redirect(safeNext(req.query.next));
    return;
  }
  res.render('auth/login', {
    title: res.locals.t('auth.login.title'),
    next: typeof req.query.next === 'string' ? req.query.next : '',
    error: null,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  const next = safeNext(req.body?.next ?? req.query.next);

  if (!parsed.success) {
    res.status(400).render('auth/login', {
      title: res.locals.t('auth.login.title'),
      next: typeof req.body?.next === 'string' ? req.body.next : '',
      error: res.locals.t('auth.error.invalidInput'),
    });
    return;
  }

  try {
    const { token, user } = await AuthService.login(parsed.data.email, parsed.data.password);
    res.cookie(config.sessionCookieName, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.sessionMaxAgeMs,
      path: '/',
    });
    logger.info('Admin logged in', { userId: user.sub, email: user.email });
    res.redirect(next);
  } catch {
    // Uniform message regardless of which check failed (no user enumeration).
    res.status(401).render('auth/login', {
      title: res.locals.t('auth.login.title'),
      next: typeof req.body?.next === 'string' ? req.body.next : '',
      error: res.locals.t('auth.error.invalidCredentials'),
    });
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie(config.sessionCookieName, { path: '/' });
  if (req.user) logger.info('Admin logged out', { userId: req.user.sub });
  res.redirect('/');
}
