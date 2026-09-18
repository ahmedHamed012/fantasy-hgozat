import type { Match, MatchStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { CreateMatchInput } from '../validators/match';
import { determineManOfTheMatch } from './scoringService';
import { AchievementService } from './achievementService';
import { FantasyService } from './fantasyService';

/** Default two-team setup for a standard match (kept data-driven, not hardcoded
 *  to exactly 10 players — team sizes are validated in the UI, not the DB). */
const DEFAULT_TEAMS = [
  { name: 'Team A', shortName: 'A' },
  { name: 'Team B', shortName: 'B' },
];

export type MatchWithTeamsAndParticipants = Prisma.MatchGetPayload<{
  include: {
    teams: true;
    participants: { include: { player: true } };
  };
}>;

/**
 * Match lifecycle + composition logic. A match owns two per-match teams (never
 * permanent) and its participants. Team assignments can only change while the
 * match is DRAFT (spec §35.4).
 */
export const MatchService = {
  /** Creates a DRAFT match with Team A and Team B. */
  async create(input: CreateMatchInput, createdById: string): Promise<Match> {
    return prisma.match.create({
      data: {
        matchDate: input.matchDate,
        title: input.title ?? null,
        status: 'DRAFT',
        createdById,
        teams: { create: DEFAULT_TEAMS },
      },
    });
  },

  async list() {
    return prisma.match.findMany({
      orderBy: [{ matchDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        teams: true,
        _count: { select: { participants: true } },
      },
    });
  },

  async getWithParticipants(id: string): Promise<MatchWithTeamsAndParticipants> {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        teams: { orderBy: { shortName: 'asc' } },
        participants: { include: { player: true } },
      },
    });
    if (!match) throw AppError.notFound('Match not found.');
    return match;
  },

  /** Guards a state transition, giving a friendly message on violation. */
  assertStatus(match: { status: MatchStatus }, expected: MatchStatus, message: string): void {
    if (match.status !== expected) throw AppError.badRequest(message);
  },

  /**
   * Replaces the match's participant/team assignments with the given map
   * (playerId -> teamId). Players omitted or set to "none" are removed. Only
   * allowed while DRAFT. Runs in a transaction so the roster is never partial.
   */
  async saveParticipants(id: string, assignments: Record<string, string>): Promise<void> {
    const match = await this.getWithParticipants(id);
    this.assertStatus(match, 'DRAFT', 'Teams can only be changed while the match is a draft.');

    const validTeamIds = new Set(match.teams.map((t) => t.id));

    // Desired assignments: only entries pointing at a real team of this match.
    const desired = new Map<string, string>();
    for (const [playerId, teamId] of Object.entries(assignments)) {
      if (typeof teamId === 'string' && validTeamIds.has(teamId)) {
        desired.set(playerId, teamId);
      }
    }

    const desiredPlayerIds = [...desired.keys()];

    await prisma.$transaction(async (tx) => {
      // Remove participants no longer selected.
      await tx.matchParticipant.deleteMany({
        where: {
          matchId: id,
          playerId: desiredPlayerIds.length ? { notIn: desiredPlayerIds } : undefined,
        },
      });

      // Create or re-team the selected participants.
      for (const [playerId, teamId] of desired) {
        await tx.matchParticipant.upsert({
          where: { matchId_playerId: { matchId: id, playerId } },
          create: { matchId: id, playerId, teamId },
          update: { teamId },
        });
      }
    });
  },

  /**
   * Transitions DRAFT -> LIVE. Requires every team to have at least one player
   * (a match needs two sides to play). Sets startedAt.
   */
  async start(id: string): Promise<Match> {
    const match = await this.getWithParticipants(id);
    this.assertStatus(match, 'DRAFT', 'Only a draft match can be started.');

    const counts = new Map<string, number>();
    for (const p of match.participants) counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);

    const everyTeamHasPlayers = match.teams.every((t) => (counts.get(t.id) ?? 0) >= 1);
    if (match.teams.length < 2 || !everyTeamHasPlayers) {
      throw AppError.badRequest('Each team needs at least one player before starting.');
    }

    return prisma.match.update({
      where: { id },
      data: { status: 'LIVE', startedAt: new Date() },
    });
  },

  /**
   * Finalizes a LIVE match in a single transaction so it can never be left
   * partially finished:
   *   - determines Man of the Match (deterministic, supports joint winners)
   *   - marks the MOTM participant(s)
   *   - flips status LIVE -> FINISHED and stamps finishedAt
   *
   * Team scores and player points are derived on demand (no denormalized
   * totals), so nothing else needs persisting here. Achievement evaluation is
   * added to this transaction in Phase 9.
   */
  async finish(id: string): Promise<MatchWithTeamsAndParticipants> {
    const match = await this.getWithParticipants(id);
    this.assertStatus(match, 'LIVE', 'Only a live match can be finished.');

    const motmIds = determineManOfTheMatch(match.participants);

    // Ensure the achievement catalog exists (idempotent) before the transaction.
    const idByCode = await AchievementService.ensureCatalog();

    await prisma.$transaction(async (tx) => {
      if (motmIds.length > 0) {
        await tx.matchParticipant.updateMany({
          where: { id: { in: motmIds } },
          data: { isMotm: true },
        });
      }
      // Mark FINISHED first so career/streak queries in achievement evaluation
      // (run on the same tx client) include this match.
      await tx.match.update({
        where: { id },
        data: { status: 'FINISHED', finishedAt: new Date() },
      });
      for (const part of match.participants) {
        await AchievementService.evaluateForParticipant(tx, part, id, idByCode);
      }
      // Finalize fantasy points for every entry on this match.
      await FantasyService.scoreEntriesForMatch(tx, id);
    });

    return this.getWithParticipants(id);
  },

  /**
   * Cancels a DRAFT or LIVE match. Cancelled matches never contribute to career
   * statistics (spec §35.15). A finished or already-cancelled match cannot be
   * cancelled.
   */
  async cancel(id: string): Promise<Match> {
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) throw AppError.notFound('Match not found.');
    if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
      throw AppError.badRequest('This match can no longer be cancelled.');
    }
    return prisma.match.update({ where: { id }, data: { status: 'CANCELLED' } });
  },
};
