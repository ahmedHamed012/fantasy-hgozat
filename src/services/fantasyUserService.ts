import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import { signUserSession, type UserSessionPayload } from '../lib/token';
import { AppError } from '../utils/AppError';
import type { RegisterInput } from '../validators/fantasyUser';

/**
 * Authentication for fantasy users (self-service accounts, separate from the
 * admin Users table).
 */
export const FantasyUserService = {
  async register(input: RegisterInput): Promise<{ token: string; user: UserSessionPayload }> {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.fantasyUser.findUnique({ where: { email } });
    if (existing) throw AppError.conflict('An account with this email already exists.');

    const user = await prisma.fantasyUser.create({
      data: {
        email,
        displayName: input.displayName,
        passwordHash: await hashPassword(input.password),
      },
    });
    return { token: sign(user), user: payload(user) };
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserSessionPayload }> {
    const normalized = email.trim().toLowerCase();
    const user = await prisma.fantasyUser.findUnique({ where: { email: normalized } });

    const ok = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');

    if (!user || !ok) throw AppError.unauthorized('Invalid email or password.');
    return { token: sign(user), user: payload(user) };
  },
};

function payload(u: { id: string; email: string; displayName: string }): UserSessionPayload {
  return { sub: u.id, email: u.email, name: u.displayName, kind: 'user' };
}
function sign(u: { id: string; email: string; displayName: string }): string {
  return signUserSession({ sub: u.id, email: u.email, name: u.displayName });
}
