import type { Request, Response } from 'express';
import { z } from 'zod';
import { FantasyUserService } from '../services/fantasyUserService';
import { registerSchema, loginSchema } from '../validators/fantasyUser';
import { config } from '../config';
import { logger } from '../utils/logger';
import type { TranslateFn } from '../i18n';

function fieldErrors(error: z.ZodError, t: TranslateFn): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !out[field]) out[field] = t(`user.error.${issue.message}`);
  }
  return out;
}

function safeNext(next: unknown): string {
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/fantasy';
}

function setSession(res: Response, token: string): void {
  res.cookie(config.userCookieName, token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.sessionMaxAgeMs,
    path: '/',
  });
}

export function showRegister(req: Request, res: Response): void {
  if (req.fantasyUser) return res.redirect(safeNext(req.query.next));
  res.render('user/register', {
    title: res.locals.t('user.register.title'),
    values: {},
    errors: {},
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  const nextUrl = safeNext(req.body?.next);
  if (!parsed.success) {
    res.status(400).render('user/register', {
      title: res.locals.t('user.register.title'),
      values: req.body,
      errors: fieldErrors(parsed.error, res.locals.t),
      next: req.body?.next ?? '',
    });
    return;
  }
  try {
    const { token, user } = await FantasyUserService.register(parsed.data);
    setSession(res, token);
    logger.info('Fantasy user registered', { userId: user.sub });
    res.redirect(nextUrl);
  } catch {
    res.status(409).render('user/register', {
      title: res.locals.t('user.register.title'),
      values: req.body,
      errors: { email: res.locals.t('user.error.emailTaken') },
      next: req.body?.next ?? '',
    });
  }
}

export function showLogin(req: Request, res: Response): void {
  if (req.fantasyUser) return res.redirect(safeNext(req.query.next));
  res.render('user/login', {
    title: res.locals.t('user.login.title'),
    error: null,
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  const nextUrl = safeNext(req.body?.next);
  if (!parsed.success) {
    res.status(400).render('user/login', {
      title: res.locals.t('user.login.title'),
      error: res.locals.t('user.error.invalidInput'),
      next: req.body?.next ?? '',
    });
    return;
  }
  try {
    const { token, user } = await FantasyUserService.login(parsed.data.email, parsed.data.password);
    setSession(res, token);
    logger.info('Fantasy user logged in', { userId: user.sub });
    res.redirect(nextUrl);
  } catch {
    res.status(401).render('user/login', {
      title: res.locals.t('user.login.title'),
      error: res.locals.t('user.error.invalidCredentials'),
      next: req.body?.next ?? '',
    });
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie(config.userCookieName, { path: '/' });
  if (req.fantasyUser) logger.info('Fantasy user logged out', { userId: req.fantasyUser.sub });
  res.redirect('/');
}
