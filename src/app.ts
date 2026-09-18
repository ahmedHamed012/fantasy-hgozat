import path from 'node:path';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { config } from './config';
import { router } from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { localeMiddleware } from './middleware/locale';
import { attachUser } from './middleware/auth';
import { provideCsrfToken } from './lib/csrf';

/**
 * Builds and configures the Express application.
 *
 * The app is created without ever calling `listen()` here so the same instance
 * can be started by a local server (`server.ts`) or wrapped by a serverless
 * handler on Vercel. No in-memory state, timers, sockets, or filesystem writes
 * are introduced — everything persistent lives in PostgreSQL.
 */
export function createApp(): Express {
  const app = express();

  // Behind Vercel's proxy; needed for secure cookies and correct protocol.
  app.set('trust proxy', 1);

  // Views. Resolved relative to this file so it works in dev (src/) and in the
  // compiled build (dist/), where copy-assets.mjs places the templates.
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'views'));

  // Security headers. contentSecurityPolicy is left at Helmet's safe default;
  // the live-match client script is served as an external file (no inline JS).
  app.use(helmet());

  // Body & cookie parsing.
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser(config.sessionSecret));

  // Static assets (css/js/images), copied to dist during build.
  app.use(
    '/static',
    express.static(path.join(__dirname, 'public'), {
      maxAge: config.isProduction ? '7d' : 0,
    }),
  );

  // Locale resolution + translation helpers (res.locals.t / locale / dir).
  app.use(localeMiddleware);

  // Authentication: attach the admin (if any) from the session cookie.
  app.use(attachUser);

  // View globals available to every template (set before CSRF so a CSRF
  // failure can never leave a template without its globals).
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.currentYear = new Date().getFullYear();
    if (res.locals.currentUser === undefined) res.locals.currentUser = null;
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
