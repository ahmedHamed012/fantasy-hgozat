import { Router } from 'express';
import * as fantasy from '../controllers/fantasyController';
import * as league from '../controllers/fantasyLeagueController';
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

// Leagues
fantasyRouter.get('/leagues', asyncHandler(league.leagues));
fantasyRouter.post('/leagues', doubleCsrfProtection, asyncHandler(league.createLeague));
fantasyRouter.post('/leagues/join', doubleCsrfProtection, asyncHandler(league.joinLeague));
fantasyRouter.get('/leagues/:id', asyncHandler(league.standings));
fantasyRouter.get('/leagues/:id/members/:userId/plan', asyncHandler(league.memberPlan));
fantasyRouter.post('/leagues/:id/leave', doubleCsrfProtection, asyncHandler(league.leaveLeague));
fantasyRouter.post('/leagues/:id/delete', doubleCsrfProtection, asyncHandler(league.deleteLeague));
