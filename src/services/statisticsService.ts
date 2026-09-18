import { prisma } from '../lib/prisma';
import { calculateMatchPoints, computeTeamScores } from './scoringService';

export interface CareerStats {
  matches: number;
  goals: number;
  assists: number;
  saves: number;
  ownGoals: number;
  points: number;
  motm: number;
}

export interface RecentMatchRow {
  matchId: string;
  title: string | null;
  matchDate: Date;
  teamName: string;
  opponentName: string;
  scoreFor: number;
  scoreAgainst: number;
  outcome: 'W' | 'D' | 'L';
  goals: number;
  assists: number;
  saves: number;
  ownGoals: number;
  points: number;
  isMotm: boolean;
}

const FINISHED = { match: { status: 'FINISHED' as const } };

/**
 * Per-player career statistics, aggregated on demand from FINISHED matches
 * only. Nothing is denormalized, so these numbers always reflect the source
 * data.
 */
export const StatisticsService = {
  async getCareerStats(playerId: string): Promise<CareerStats> {
    const [agg, motm] = await Promise.all([
      prisma.matchParticipant.aggregate({
        where: { playerId, ...FINISHED },
        _sum: { goals: true, assists: true, saves: true, ownGoals: true },
        _count: { _all: true },
      }),
      prisma.matchParticipant.count({ where: { playerId, isMotm: true, ...FINISHED } }),
    ]);

    const goals = agg._sum.goals ?? 0;
    const assists = agg._sum.assists ?? 0;
    const saves = agg._sum.saves ?? 0;
    const ownGoals = agg._sum.ownGoals ?? 0;

    return {
      matches: agg._count._all,
      goals,
      assists,
      saves,
      ownGoals,
      points: calculateMatchPoints({ goals, assists, saves, ownGoals }),
      motm,
    };
  },

  /** Most recent finished matches for a player, with the result and their line. */
  async getRecentMatches(playerId: string, limit = 10): Promise<RecentMatchRow[]> {
    const parts = await prisma.matchParticipant.findMany({
      where: { playerId, ...FINISHED },
      orderBy: { match: { matchDate: 'desc' } },
      take: limit,
      include: {
        team: true,
        match: {
          include: {
            teams: true,
            participants: { select: { teamId: true, goals: true, ownGoals: true } },
          },
        },
      },
    });

    return parts.map((p) => {
      const scores = computeTeamScores(p.match.teams, p.match.participants);
      const opponent = p.match.teams.find((t) => t.id !== p.teamId);
      const scoreFor = scores[p.teamId] ?? 0;
      const scoreAgainst = opponent ? (scores[opponent.id] ?? 0) : 0;
      const outcome: 'W' | 'D' | 'L' =
        scoreFor > scoreAgainst ? 'W' : scoreFor < scoreAgainst ? 'L' : 'D';

      return {
        matchId: p.matchId,
        title: p.match.title,
        matchDate: p.match.matchDate,
        teamName: p.team.name,
        opponentName: opponent?.name ?? '',
        scoreFor,
        scoreAgainst,
        outcome,
        goals: p.goals,
        assists: p.assists,
        saves: p.saves,
        ownGoals: p.ownGoals,
        points: calculateMatchPoints(p),
        isMotm: p.isMotm,
      };
    });
  },
};
