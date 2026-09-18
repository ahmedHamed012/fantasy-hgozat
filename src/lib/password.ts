import bcrypt from 'bcryptjs';

/**
 * Password hashing helpers. Plaintext passwords are never stored — only bcrypt
 * hashes. Cost factor 12 is a sensible balance for an admin login on a
 * serverless platform (fast enough per request, expensive enough to brute).
 */
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
