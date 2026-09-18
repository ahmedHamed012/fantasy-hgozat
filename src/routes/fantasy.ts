import { Router } from 'express';
import * as fantasy from '../controllers/fantasyController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireUser } from '../middleware/auth';
import { doubleCsrfProtection } from '../lib/csrf';

/**
 * Fantasy game area — everything under /fantasy requires a logged-in fantasy
 * user.
 */
export const fantasyRouter = Router();

fantasyRouter.use(requireUser);

fantasyRouter.get('/', asyncHandler(fantasy.dashboard));
fantasyRouter.get('/leaderboard', asyncHandler(fantasy.leaderboard));
fantasyRouter.get('/matches/:id/plan', asyncHandler(fantasy.planForm));
fantasyRouter.post(
  '/matches/:id/plan',
  doubleCsrfProtection,
  asyncHandler(fantasy.savePlan),
);
