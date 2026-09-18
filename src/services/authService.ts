import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signSession, type SessionPayload } from '../lib/token';
import { AppError } from '../utils/AppError';

/**
 * Authentication business logic, kept out of controllers so it can be reused
 * (e.g. by a future mobile API or the admin-bootstrap script).
 */
export const AuthService = {
  /**
   * Verifies email + password and returns a signed session token. Uses a
   * generic error message for both "no such user" and "wrong password" so the
   * endpoint does not reveal which emails exist.
   */
  async login(email: string, password: string): Promise<{ token: string; user: SessionPayload }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always run a hash comparison to keep timing roughly constant whether or
    // not the user exists.
    const ok = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');

    if (!user || !ok) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const payload: SessionPayload = { sub: user.id, email: user.email, role: user.role };
    return { token: signSession(payload), user: payload };
  },

  /**
   * Creates or updates the bootstrap admin. Used by the create-admin script and
   * the seed. Idempotent: re-running updates the password.
   */
  async upsertAdmin(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);
    return prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { passwordHash, role: 'ADMIN' },
      create: { email: normalizedEmail, passwordHash, role: 'ADMIN' },
    });
  },
};
