import { Router } from 'express';
import * as matchController from '../controllers/adminMatchController';
import { asyncHandler } from '../utils/asyncHandler';
import { doubleCsrfProtection } from '../lib/csrf';

/**
 * Admin match management, mounted under /admin/matches (behind requireAdmin).
 * Mutations are CSRF-protected (the AJAX quick-add player sends the token via
 * the x-csrf-token header).
 */
export const adminMatchesRouter = Router();

adminMatchesRouter.get('/', asyncHandler(matchController.list));
adminMatchesRouter.get('/new', matchController.newForm);
adminMatchesRouter.post('/', doubleCsrfProtection, asyncHandler(matchController.create));

adminMatchesRouter.get('/:id', asyncHandler(matchController.details));
adminMatchesRouter.get('/:id/setup', asyncHandler(matchController.setup));
adminMatchesRouter.post(
  '/:id/participants',
  doubleCsrfProtection,
  asyncHandler(matchController.saveParticipants),
);
adminMatchesRouter.post(
  '/:id/quick-player',
  doubleCsrfProtection,
  asyncHandler(matchController.quickAddPlayer),
);
adminMatchesRouter.post('/:id/start', doubleCsrfProtection, asyncHandler(matchController.start));
