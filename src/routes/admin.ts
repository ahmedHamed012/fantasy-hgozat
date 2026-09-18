import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
import { adminPlayersRouter } from './adminPlayers';
import { adminMatchesRouter } from './adminMatches';

/**
 * Admin router — everything under /admin requires an authenticated admin.
 * Feature sub-routers (players, matches) mount here.
 */
export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/', adminController.dashboard);
adminRouter.use('/players', adminPlayersRouter);
adminRouter.use('/matches', adminMatchesRouter);
