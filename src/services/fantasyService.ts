import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { calculateMatchPoints } from './scoringService';

type Tx = Prisma.TransactionClient | PrismaClient;

const { budget: BUDGET, squadSize: SQUAD_SIZE } = config.fantasy;

export type EntryWithPicks = Prisma.FantasyEntryGetPayload<{
  include: { picks: { include: { participant: { include: { player: true } } } } };
}>;

/**
 * Fantasy game logic. Each scheduled (DRAFT) match is an independent contest
 * with a fresh budget cap; a user picks exactly SQUAD_SIZE of the match's
 * players within budget and names a captain (double points). Entries are
 * editable until kickoff (LIVE) and scored when the match is finished.
 */
export const FantasyService = {
  budget: BUDGET,
  squadSize: SQUAD_SIZE,

  /** Points for an entry from its picks' stats (captain counted twice). */
  computePoints(picks: EntryWithPicks['picks']): number {
    let total = 0;
    for (const pick of picks) {
      const pts = calculateMatchPoints(pick.participant);
      total += pts;
      if (pick.isCaptain) total += pts * (config.fantasy.captainMultiplier - 1);
    }
    return total;
  },

  /** Matches open for entry: DRAFT with a full-enough roster. */
  async openMatches() {
    return prisma.match.findMany({
      where: { status: 'DRAFT', participants: { some: {} } },
      orderBy: [{ matchDate: 'asc' }, { createdAt: 'asc' }],
      include: { teams: true, _count: { select: { participants: true } } },
    });
  },

  async getEntry(userId: string, matchId: string): Promise<EntryWithPicks | null> {
    return prisma.fantasyEntry.findUnique({
      where: { userId_matchId: { userId, matchId } },
      include: { picks: { include: { participant: { include: { player: true } } } } },
    });
  },

  /** A user's entries for LIVE/FINISHED matches, with points (live or final). */
  async myEntries(userId: string) {
    const entries = await prisma.fantasyEntry.findMany({
      where: { userId, match: { status: { in: ['LIVE', 'FINISHED'] } } },
      orderBy: { match: { matchDate: 'desc' } },
      include: {
        match: { include: { teams: true } },
        picks: { include: { participant: { include: { player: true } } } },
      },
    });
    return entries.map((e) => ({
      entry: e,
      points: e.points ?? this.computePoints(e.picks),
      isFinal: e.match.status === 'FINISHED',
    }));
  },

  /** Match a user can build a plan for; only DRAFT matches are editable. */
  async getMatchForPlan(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teams: { orderBy: { shortName: 'asc' } },
        participants: { include: { player: true }, orderBy: { player: { name: 'asc' } } },
      },
    });
    if (!match) throw AppError.notFound('Match not found.');
    return match;
  },

  /**
   * Creates or replaces a user's plan for a match. Validates roster membership,
   * squad size, captain, and budget. Only allowed while the match is DRAFT.
   */
  async savePlan(
    userId: string,
    matchId: string,
    participantIds: string[],
    captainParticipantId: string,
  ): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { participants: true },
    });
    if (!match) throw AppError.notFound('Match not found.');
    if (match.status !== 'DRAFT') throw AppError.badRequest('fantasy.error.locked');

    const uniqueIds = [...new Set(participantIds)];
    if (uniqueIds.length !== SQUAD_SIZE) throw AppError.badRequest('fantasy.error.count');

    const byId = new Map(match.participants.map((p) => [p.id, p]));
    const chosen = uniqueIds.map((id) => byId.get(id));
    if (chosen.some((p) => !p)) throw AppError.badRequest('fantasy.error.invalid');

    if (!uniqueIds.includes(captainParticipantId)) {
      throw AppError.badRequest('fantasy.error.captain');
    }

    // Budget check uses each player's price.
    const players = await prisma.player.findMany({
      where: { id: { in: chosen.map((p) => p!.playerId) } },
      select: { id: true, price: true },
    });
    const priceById = new Map(players.map((p) => [p.id, p.price]));
    const totalCost = chosen.reduce((sum, p) => sum + (priceById.get(p!.playerId) ?? 0), 0);
    if (totalCost > BUDGET) throw AppError.badRequest('fantasy.error.budget');

    await prisma.$transaction(async (tx) => {
      const entry = await tx.fantasyEntry.upsert({
        where: { userId_matchId: { userId, matchId } },
        create: { userId, matchId },
        update: {},
      });
      // Replace picks wholesale.
      await tx.fantasyPick.deleteMany({ where: { entryId: entry.id } });
      await tx.fantasyPick.createMany({
        data: uniqueIds.map((participantId) => ({
          entryId: entry.id,
          matchParticipantId: participantId,
          isCaptain: participantId === captainParticipantId,
        })),
      });
    });
  },

  /** Finalizes fantasy points for every entry of a finished match (in the
   *  finish transaction). */
  async scoreEntriesForMatch(tx: Tx, matchId: string): Promise<void> {
    const entries = await tx.fantasyEntry.findMany({
      where: { matchId },
      include: { picks: { include: { participant: true } } },
    });
    for (const entry of entries) {
      const points = this.computePoints(entry.picks as EntryWithPicks['picks']);
      await tx.fantasyEntry.update({ where: { id: entry.id }, data: { points } });
    }
  },

  /** Fantasy leaderboard: users ranked by total finalized points. */
  async getLeaderboard() {
    const grouped = await prisma.fantasyEntry.groupBy({
      by: ['userId'],
      where: { points: { not: null } },
      _sum: { points: true },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const users = await prisma.fantasyUser.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, displayName: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return grouped
      .map((g) => ({
        user: userById.get(g.userId)!,
        points: g._sum.points ?? 0,
        entries: g._count._all,
      }))
      .filter((r) => r.user)
      .sort((a, b) => b.points - a.points || a.user.displayName.localeCompare(b.user.displayName))
      .map((r, i) => ({ rank: i + 1, ...r }));
  },
};
