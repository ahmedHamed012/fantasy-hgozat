import type { Request, Response, NextFunction } from 'express';
import {
  createTranslator,
  isLocale,
  DEFAULT_LOCALE,
  LOCALE_DIR,
  type Locale,
} from '../i18n';
import { config } from '../config';

const LANG_COOKIE = 'lang';
const LANG_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Resolves the request locale in priority order:
 *   1. `lang` cookie (an explicit user choice)
 *   2. Accept-Language header (browser preference)
 *   3. DEFAULT_LOCALE
 * and exposes translation helpers to every view via res.locals.
 */
export function localeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const locale = resolveLocale(req);
  const t = createTranslator(locale);

  res.locals.locale = locale;
  res.locals.dir = LOCALE_DIR[locale];
  res.locals.t = t;
  // The locale a switch link should flip to (the other supported language).
  res.locals.otherLocale = locale === 'en' ? 'ar' : 'en';

  next();
}

function resolveLocale(req: Request): Locale {
  const cookieLang = req.cookies?.[LANG_COOKIE];
  if (isLocale(cookieLang)) return cookieLang;

  const accept = req.headers['accept-language'];
  if (accept && /(^|[,;\s])ar\b/i.test(accept)) return 'ar';

  return DEFAULT_LOCALE;
}

/** Persists a language choice in a cookie and redirects back where the user was. */
export function setLanguage(req: Request, res: Response): void {
  const requested = req.params.locale;
  const locale: Locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  res.cookie(LANG_COOKIE, locale, {
    maxAge: LANG_COOKIE_MAX_AGE,
    httpOnly: false, // purely a UI preference; safe for client visibility
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  });

  // Only redirect to a safe, same-site relative path.
  const back = typeof req.query.next === 'string' ? req.query.next : req.get('referer');
  const safe = back && back.startsWith('/') ? back : '/';
  res.redirect(safe);
}
