import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Stateless session tokens (JWT).
 *
 * The signed token carries everything the app needs to identify the admin on a
 * request, so no session store or per-request DB lookup is required — ideal for
 * Vercel's serverless model. The token is delivered in an httpOnly cookie.
 */
export interface SessionPayload {
  sub: string; // user id
  email: string;
  role: string;
}

const EXPIRES_IN = '7d';

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, config.sessionSecret, { expiresIn: EXPIRES_IN });
}

/** Verifies a token; returns the payload or null if invalid/expired. */
export function verifySession(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, config.sessionSecret);
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.sub === 'string' &&
      typeof (decoded as Record<string, unknown>).email === 'string' &&
      typeof (decoded as Record<string, unknown>).role === 'string'
    ) {
      const d = decoded as unknown as SessionPayload;
      return { sub: d.sub, email: d.email, role: d.role };
    }
    return null;
  } catch {
    return null;
  }
}
