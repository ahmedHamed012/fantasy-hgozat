import type { Player } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calculateMatchPoints } from './scoringService';

export interface LeaderboardRow {
  rank: number;
  player: Player;
  matches: number;
  goals: number;
  assists: number;
  saves: number;
  ownGoals: number;
  points: number;
  motm: number;
}

/**
 * Global ranking. Career totals are aggregated live from MatchParticipant rows
 * that belong to FINISHED matches (cancelled/draft/live never count — spec §14,
 * §35.15), so the leaderboard can never drift out of sync. Ranks are assigned
 * dynamically and are never stored.
 */
export const RankingService = {
  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const finished = { match: { status: 'FINISHED' as const } };

    // Aggregate stat sums + matches played per player.
    const grouped = await prisma.matchParticipant.groupBy({
      by: ['playerId'],
      where: finished,
      _sum: { goals: true, assists: true, saves: true, ownGoals: true },
      _count: { _all: true },
    });

    if (grouped.length === 0) return [];

    // MOTM awards per player (separate query: can't sum a boolean).
    const motmGroups = await prisma.matchParticipant.groupBy({
      by: ['playerId'],
      where: { ...finished, isMotm: true },
      _count: { _all: true },
    });
    const motmByPlayer = new Map(motmGroups.map((g) => [g.playerId, g._count._all]));

    const players = await prisma.player.findMany({
      where: { id: { in: grouped.map((g) => g.playerId) } },
    });
    const playerById = new Map(players.map((p) => [p.id, p]));

    const rows = grouped
      .map((g) => {
        const goals = g._sum.goals ?? 0;
        const assists = g._sum.assists ?? 0;
        const saves = g._sum.saves ?? 0;
        const ownGoals = g._sum.ownGoals ?? 0;
        return {
          player: playerById.get(g.playerId)!,
          matches: g._count._all,
          goals,
          assists,
          saves,
          ownGoals,
          points: calculateMatchPoints({ goals, assists, saves, ownGoals }),
          motm: motmByPlayer.get(g.playerId) ?? 0,
        };
      })
      .filter((r) => r.player) // guard against a missing player row
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goals - a.goals ||
          b.assists - a.assists ||
          b.matches - a.matches ||
          a.player.name.localeCompare(b.player.name),
      );

    // Dynamic, positional rank (1..n).
    return rows.map((r, i) => ({ rank: i + 1, ...r }));
  },

  /** The player's leaderboard rank, or null if they have no finished matches. */
  async getPlayerRank(playerId: string): Promise<number | null> {
    const board = await this.getLeaderboard();
    const row = board.find((r) => r.player.id === playerId);
    return row ? row.rank : null;
  },
};
