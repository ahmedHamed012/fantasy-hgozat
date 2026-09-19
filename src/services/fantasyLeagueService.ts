import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

// Unambiguous alphabet for shareable codes (no 0/O/1/I).
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

function generateCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 12; i++) {
    const code = generateCode();
    const exists = await prisma.fantasyLeague.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique league code');
}

export interface StandingRow {
  rank: number;
  user: { id: string; displayName: string };
  points: number;
  entries: number;
  isOwner: boolean;
}

/**
 * Private fantasy mini-leagues. A user creates a league (becoming its owner and
 * first member) and shares the `code`; others join with it. Standings rank the
 * members by their total fantasy points.
 */
export const FantasyLeagueService = {
  async createLeague(userId: string, name: string) {
    const code = await uniqueCode();
    return prisma.fantasyLeague.create({
      data: {
        name: name.trim(),
        code,
        ownerId: userId,
        members: { create: { userId } },
      },
    });
  },

  async joinByCode(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const league = await prisma.fantasyLeague.findUnique({ where: { code } });
    if (!league) throw AppError.badRequest('league.error.notFound');

    // Idempotent join (unique constraint on leagueId+userId).
    await prisma.fantasyLeagueMember.upsert({
      where: { leagueId_userId: { leagueId: league.id, userId } },
      create: { leagueId: league.id, userId },
      update: {},
    });
    return league;
  },

  async myLeagues(userId: string) {
    const memberships = await prisma.fantasyLeagueMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: { league: { include: { _count: { select: { members: true } } } } },
    });
    return memberships.map((m) => ({
      league: m.league,
      members: m.league._count.members,
      isOwner: m.league.ownerId === userId,
    }));
  },

  /** League standings; only members may view (leagues are private). */
  async getStandings(userId: string, leagueId: string): Promise<{
    league: { id: string; name: string; code: string; ownerId: string };
    rows: StandingRow[];
    isOwner: boolean;
  }> {
    const league = await prisma.fantasyLeague.findUnique({
      where: { id: leagueId },
      include: { members: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    if (!league) throw AppError.notFound('League not found.');

    const memberIds = league.members.map((m) => m.userId);
    if (!memberIds.includes(userId)) throw AppError.forbidden('You are not a member of this league.');

    const grouped = await prisma.fantasyEntry.groupBy({
      by: ['userId'],
      where: { userId: { in: memberIds }, points: { not: null } },
      _sum: { points: true },
      _count: { _all: true },
    });
    const stat = new Map(grouped.map((g) => [g.userId, { points: g._sum.points ?? 0, entries: g._count._all }]));

    const rows: Omit<StandingRow, 'rank'>[] = league.members.map((m) => ({
      user: m.user,
      points: stat.get(m.userId)?.points ?? 0,
      entries: stat.get(m.userId)?.entries ?? 0,
      isOwner: m.userId === league.ownerId,
    }));
    rows.sort((a, b) => b.points - a.points || a.user.displayName.localeCompare(b.user.displayName));

    return {
      league: { id: league.id, name: league.name, code: league.code, ownerId: league.ownerId },
      rows: rows.map((r, i) => ({ rank: i + 1, ...r })),
      isOwner: league.ownerId === userId,
    };
  },

  async leaveLeague(userId: string, leagueId: string): Promise<void> {
    const league = await prisma.fantasyLeague.findUnique({ where: { id: leagueId } });
    if (!league) throw AppError.notFound('League not found.');
    if (league.ownerId === userId) throw AppError.badRequest('league.error.ownerLeave');
    await prisma.fantasyLeagueMember.deleteMany({ where: { leagueId, userId } });
  },

  async deleteLeague(userId: string, leagueId: string): Promise<void> {
    const league = await prisma.fantasyLeague.findUnique({ where: { id: leagueId } });
    if (!league) throw AppError.notFound('League not found.');
    if (league.ownerId !== userId) throw AppError.forbidden('Only the owner can delete this league.');
    await prisma.fantasyLeague.delete({ where: { id: leagueId } });
  },
};
