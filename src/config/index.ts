import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated application configuration.
 *
 * Every value the app depends on is read here exactly once so the rest of the
 * codebase never touches `process.env` directly. Missing critical secrets fail
 * fast at boot rather than surfacing as confusing runtime errors later.
 */

function required(name: string, fallbackInDev?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (fallbackInDev !== undefined && process.env.NODE_ENV !== 'production') {
    return fallbackInDev;
  }
  throw new Error(`Missing required environment variable: ${name}`);
}

const env = process.env.NODE_ENV ?? 'development';

export const config = {
  env,
  isProduction: env === 'production',
  port: Number(process.env.PORT ?? 3000),

  databaseUrl: process.env.DATABASE_URL ?? '',
  directUrl: process.env.DIRECT_URL ?? '',

  sessionSecret: required('SESSION_SECRET', 'dev-session-secret-not-for-production'),
  csrfSecret: required('CSRF_SECRET', 'dev-csrf-secret-not-for-production'),

  // Session cookie lifetime (7 days).
  sessionMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  sessionCookieName: 'footy_session',
  // Separate cookie for fantasy users (independent from admin sessions).
  userCookieName: 'footy_user',

  // Fantasy game rules.
  fantasy: {
    budget: 100, // millions LE, fresh cap per match
    squadSize: 5,
    captainMultiplier: 2,
  },
} as const;

export type AppConfig = typeof config;
