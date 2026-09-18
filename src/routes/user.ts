import { Router } from 'express';
import * as userAuth from '../controllers/userAuthController';
import { asyncHandler } from '../utils/asyncHandler';
import { doubleCsrfProtection } from '../lib/csrf';
import { loginRateLimiter } from '../middleware/rateLimit';

/**
 * Fantasy-user authentication (self-service). Separate from the admin auth at
 * /auth. Register and login are rate-limited and CSRF-protected.
 */
export const userRouter = Router();

userRouter.get('/register', userAuth.showRegister);
userRouter.post('/register', loginRateLimiter, doubleCsrfProtection, asyncHandler(userAuth.register));

userRouter.get('/login', userAuth.showLogin);
userRouter.post('/login', loginRateLimiter, doubleCsrfProtection, asyncHandler(userAuth.login));

userRouter.post('/logout', doubleCsrfProtection, userAuth.logout);
