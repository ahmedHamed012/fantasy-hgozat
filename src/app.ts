import path from 'node:path';
import fs from 'node:fs';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { config } from './config';
import { router } from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { localeMiddleware } from './middleware/locale';
import { attachUser, attachFantasyUser } from './middleware/auth';
import { provideCsrfToken } from './lib/csrf';

/**
 * Builds and configures the Express application.
 *
 * The app is created without ever calling `listen()` here so the same instance
 * can be started by a local server (`server.ts`) or wrapped by a serverless
 * handler on Vercel. No in-memory state, timers, sockets, or filesystem writes
 * are introduced — everything persistent lives in PostgreSQL.
 */
/** Returns the first existing directory for a bundled asset folder (views/public). */
function resolveAssetDir(sub: string): string {
  const candidates = [
    path.join(__dirname, sub), // compiled app sits next to src/views + src/public
    path.join(process.cwd(), 'src', sub),
    path.join(process.cwd(), sub),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore and try the next candidate */
    }
  }
  return candidates[0];
}

export function createApp(): Express {
  const app = express();

  // Behind Vercel's proxy; needed for secure cookies and correct protocol.
  app.set('trust proxy', 1);

  // Resolve views + static assets from the first candidate that exists. This
  // works across every environment without configuration:
  //   - dev (tsx):            __dirname = src/            -> src/<sub>
  //   - Vercel (@vercel/node): __dirname = /var/task/src/ -> /var/task/src/<sub>
  //   - local prod (dist):    __dirname = dist/ (no assets) -> falls back to
  //                            <cwd>/src/<sub>
  // Overridable via VIEWS_DIR / PUBLIC_DIR for other hosts.
  const viewsDir = process.env.VIEWS_DIR ?? resolveAssetDir('views');
  const publicDir = process.env.PUBLIC_DIR ?? resolveAssetDir('public');

  app.set('view engine', 'pug');
  app.set('views', viewsDir);

  // Security headers. contentSecurityPolicy is left at Helmet's safe default;
  // the live-match client script is served as an external file (no inline JS).
  app.use(helmet());

  // Body & cookie parsing.
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser(config.sessionSecret));

  // Static assets (css/js/images).
  app.use(
    '/static',
    express.static(publicDir, {
      maxAge: config.isProduction ? '7d' : 0,
    }),
  );

  // Locale resolution + translation helpers (res.locals.t / locale / dir).
  app.use(localeMiddleware);

  // Authentication: attach the admin and/or fantasy user from their cookies.
  app.use(attachUser);
  app.use(attachFantasyUser);

  // View globals available to every template (set before CSRF so a CSRF
  // failure can never leave a template without its globals).
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.currentYear = new Date().getFullYear();
    if (res.locals.currentUser === undefined) res.locals.currentUser = null;
    if (res.locals.fantasyUser === undefined) res.locals.fantasyUser = null;
    next();
  });

  // Expose a CSRF token to views on safe requests.
  app.use(provideCsrfToken);

  app.use('/', router);

  // 404 + centralized error handling (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
