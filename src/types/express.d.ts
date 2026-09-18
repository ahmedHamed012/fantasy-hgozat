import type { SessionPayload } from '../lib/token';

/**
 * Augments Express's Request with the authenticated admin (populated by the
 * attachUser middleware from the JWT session cookie).
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

export {};
