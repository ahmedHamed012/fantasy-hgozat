import { Router } from 'express';
import * as playerController from '../controllers/adminPlayerController';
import { asyncHandler } from '../utils/asyncHandler';
import { doubleCsrfProtection } from '../lib/csrf';

/**
 * Admin player management. Mounted under /admin/players (already behind
 * requireAdmin). Mutations are CSRF-protected; reads render forms/lists.
 */
export const adminPlayersRouter = Router();

adminPlayersRouter.get('/', asyncHandler(playerController.list));
adminPlayersRouter.get('/new', playerController.newForm);
adminPlayersRouter.post('/', doubleCsrfProtection, asyncHandler(playerController.create));
adminPlayersRouter.get('/:id/edit', asyncHandler(playerController.editForm));
adminPlayersRouter.post('/:id', doubleCsrfProtection, asyncHandler(playerController.update));
adminPlayersRouter.post(
  '/:id/deactivate',
  doubleCsrfProtection,
  asyncHandler(playerController.deactivate),
);
adminPlayersRouter.post(
  '/:id/activate',
  doubleCsrfProtection,
  asyncHandler(playerController.activate),
);
