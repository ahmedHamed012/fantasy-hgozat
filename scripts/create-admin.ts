/**
 * Creates (or updates) the bootstrap admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 * Run once after deploying, before the first login:
 *   npm run create-admin
 *
 * Idempotent — re-running updates the existing admin's password.
 */
import { AuthService } from '../src/services/authService';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.');
  }

  const admin = await AuthService.upsertAdmin(email, password);
  console.log(`✅ Admin ready: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to create admin:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
