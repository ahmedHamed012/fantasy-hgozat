import { Router } from 'express';
import * as leaderboardController from '../controllers/leaderboardController';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Public (unauthenticated) pages: the global leaderboard and player profiles.
 * These reuse the same services a future mobile API would consume.
 */
export const publicRouter = Router();

publicRouter.get('/leaderboard', asyncHandler(leaderboardController.leaderboard));
publicRouter.get('/players/:id', asyncHandler(leaderboardController.profile));
publicRouter.get('/players/:id/profile', asyncHandler(leaderboardController.profile));
