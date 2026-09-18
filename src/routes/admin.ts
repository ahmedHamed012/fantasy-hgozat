import { Router } from 'express';
import * as adminController from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';

/**
 * Admin router — everything under /admin requires an authenticated admin.
 * Feature sub-routers (players, matches) mount here in later phases.
 */
export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/', adminController.dashboard);
