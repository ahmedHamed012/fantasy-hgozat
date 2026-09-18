import { Router } from 'express';
import * as authController from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { doubleCsrfProtection } from '../lib/csrf';
import { loginRateLimiter } from '../middleware/rateLimit';

/**
 * Authentication routes. The login POST is both rate-limited and CSRF-protected.
 * Logout is a POST (CSRF-protected) so it cannot be triggered by a cross-site
 * GET / prefetch.
 */
export const authRouter = Router();

authRouter.get('/login', authController.showLogin);
authRouter.post(
  '/login',
  loginRateLimiter,
  doubleCsrfProtection,
  asyncHandler(authController.login),
);
authRouter.post('/logout', doubleCsrfProtection, authController.logout);
