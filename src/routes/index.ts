import { Router } from 'express';
import * as homeController from '../controllers/homeController';
import { setLanguage } from '../middleware/locale';
import { authRouter } from './auth';
import { adminRouter } from './admin';
import { publicRouter } from './public';
import { userRouter } from './user';
import { fantasyRouter } from './fantasy';

/**
 * Root router. As the app grows, feature routers (auth, players, matches,
 * leaderboard, admin) are mounted here. Keeping mounting centralized makes the
 * URL surface easy to audit.
 */
export const router = Router();

router.get('/', homeController.home);
router.get('/health', homeController.health);

// Language switch (persists a `lang` cookie, then redirects back).
router.get('/lang/:locale', setLanguage);

// Feature routers.
router.use('/', publicRouter);
router.use('/', userRouter);
router.use('/fantasy', fantasyRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
