import type { Request, Response } from 'express';
import { RankingService } from '../services/rankingService';
import { StatisticsService } from '../services/statisticsService';
import { PlayerService } from '../services/playerService';

/** Public global leaderboard. */
export async function leaderboard(_req: Request, res: Response): Promise<void> {
  const rows = await RankingService.getLeaderboard();
  res.render('leaderboard', {
    title: res.locals.t('leaderboard.title'),
    rows,
  });
}

/** Public player profile: career stats, rank, recent matches, achievements. */
export async function profile(req: Request, res: Response): Promise<void> {
  const player = await PlayerService.getById(req.params.id);
  const [stats, rank, recent] = await Promise.all([
    StatisticsService.getCareerStats(player.id),
    RankingService.getPlayerRank(player.id),
    StatisticsService.getRecentMatches(player.id),
  ]);

  res.render('players/profile', {
    title: player.name,
    player,
    stats,
    rank,
    recent,
    achievements: [], // populated in Phase 9
  });
}
