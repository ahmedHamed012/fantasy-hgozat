import { PrismaClient } from '@prisma/client';
import { config } from '../config';

/**
 * Shared Prisma client.
 *
 * On serverless (Vercel), each warm invocation reuses the same module instance,
 * so we create the client once. In development, tsx watch reloads the module on
 * every change; caching the client on `globalThis` prevents a flood of new
 * connections (and the classic "too many clients" error) across reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
  });

if (!config.isProduction) {
  global.__prisma = prisma;
}
