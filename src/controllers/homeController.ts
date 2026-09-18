import type { Request, Response } from 'express';

/**
 * Public landing page. For the MVP this simply orients a visitor and links to
 * the leaderboard and admin login (both added in later phases).
 */
export function home(_req: Request, res: Response): void {
  // No `title` local → base layout falls back to the plain site name.
  res.render('home', {});
}

/** Lightweight health probe (useful for Vercel / uptime checks). */
export function health(_req: Request, res: Response): void {
  res.json({ status: 'ok', time: new Date().toISOString() });
}
