import type { Request, Response } from 'express';

/**
 * Admin dashboard. Phase 3 ships a minimal placeholder so the authenticated
 * area exists; later phases add recent matches, quick-create, top players and
 * the leaderboard summary.
 */
export function dashboard(_req: Request, res: Response): void {
  res.render('admin/dashboard', {
    title: res.locals.t('admin.dashboard.title'),
  });
}
