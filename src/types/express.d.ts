import type { SessionPayload, UserSessionPayload } from '../lib/token';

/**
 * Augments Express's Request with the authenticated admin (attachUser) and/or
 * fantasy user (attachFantasyUser), each populated from its own JWT cookie.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionPayload;
      fantasyUser?: UserSessionPayload;
    }
  }
}

export {};
