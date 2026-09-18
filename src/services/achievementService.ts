import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { calculateMatchPoints } from './scoringService';
import type { TranslateFn } from '../i18n';

/**
 * Data-driven achievement system.
 *
 * DEFINITIONS is the single source of truth: adding a new badge is one entry
 * here (code, icon, English label for the DB catalog, and a pure `evaluate`
 * predicate) plus its two i18n keys — no other part of the app changes.
 * Display strings are translated via i18n keys `achievement.<code>.name/desc`;
 * the DB `achievements` table stores the canonical English label + icon and is
 * upserted from these definitions.
 */

/** Everything a predicate can look at, computed once per participant at finish. */
export interface AchievementContext {
  /** This match's stat line for the player. */
  match: { goals: number; assists: number; saves: number; ownGoals: number };
  /** Career totals including this just-finished match. */
  career: { points: number };
  /** Goals in the player's most recent finished matches, newest first
   *  (includes this match). */
  recentGoals: number[];
}

export interface AchievementDefinition {
  code: string;
  icon: string;
  name: string; // canonical English (DB catalog + i18n fallback)
  description: string;
  evaluate: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    code: 'HAT_TRICK',
    icon: '🎩',
    name: 'Hat Trick',
    description: '3+ goals in one match',
    evaluate: (c) => c.match.goals >= 3,
  },
  {
    code: 'DOUBLE_HAT_TRICK',
    icon: '🎩🎩',
    name: 'Double Hat Trick',
    description: '6+ goals in one match',
    evaluate: (c) => c.match.goals >= 6,
  },
  {
    code: 'PLAYMAKER',
    icon: '🅰️',
    name: 'Playmaker',
    description: '4+ assists in one match',
    evaluate: (c) => c.match.assists >= 4,
  },
  {
    code: 'WALL',
    icon: '🧱',
    name: 'Wall',
    description: '10+ saves in one match',
    evaluate: (c) => c.match.saves >= 10,
  },
  {
    code: 'CENTURY',
    icon: '💯',
    name: 'Century',
    description: '100+ career points',
    evaluate: (c) => c.career.points >= 100,
  },
  {
    code: 'ON_FIRE',
    icon: '🔥',
    name: 'On Fire',
    description: 'Scored in 5 consecutive matches',
    evaluate: (c) => c.recentGoals.length >= 5 && c.recentGoals.slice(0, 5).every((g) => g >= 1),
  },
];

type Tx = Prisma.TransactionClient | PrismaClient;

const FINISHED = { match: { status: 'FINISHED' as const } };

export const AchievementService = {
  /** Upserts the catalog into the DB. Idempotent; returns a code -> id map. */
  async ensureCatalog(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const row = await prisma.achievement.upsert({
        where: { code: def.code },
        update: { name: def.name, description: def.description, icon: def.icon },
        create: { code: def.code, name: def.name, description: def.description, icon: def.icon },
      });
      map.set(def.code, row.id);
    }
    return map;
  },

  /**
   * Evaluates every achievement for one participant and unlocks any newly
   * earned badges (unique per player, enforced by the DB). Must run inside the
   * finish transaction (after the match is marked FINISHED) so career/streak
   * queries see this match. Returns the codes unlocked in THIS call.
   */
  async evaluateForParticipant(
    tx: Tx,
    participant: { playerId: string; goals: number; assists: number; saves: number; ownGoals: number },
    matchId: string,
    idByCode: Map<string, string>,
  ): Promise<string[]> {
    const [career, recent] = await Promise.all([
      tx.matchParticipant.aggregate({
        where: { playerId: participant.playerId, ...FINISHED },
        _sum: { goals: true, assists: true, saves: true, ownGoals: true },
      }),
      tx.matchParticipant.findMany({
        where: { playerId: participant.playerId, ...FINISHED },
        orderBy: { match: { matchDate: 'desc' } },
        take: 5,
        select: { goals: true },
      }),
    ]);

    const careerPoints = calculateMatchPoints({
      goals: career._sum.goals ?? 0,
      assists: career._sum.assists ?? 0,
      saves: career._sum.saves ?? 0,
      ownGoals: career._sum.ownGoals ?? 0,
    });

    const ctx: AchievementContext = {
      match: participant,
      career: { points: careerPoints },
      recentGoals: recent.map((r) => r.goals),
    };

    const earnedCodes = ACHIEVEMENT_DEFINITIONS.filter((d) => d.evaluate(ctx)).map((d) => d.code);
    if (earnedCodes.length === 0) return [];

    // createMany + skipDuplicates makes unlocking idempotent against the unique
    // (playerId, achievementId) constraint — a badge unlocks at most once.
    const rows = earnedCodes
      .map((code) => idByCode.get(code))
      .filter((id): id is string => Boolean(id))
      .map((achievementId) => ({ playerId: participant.playerId, achievementId, matchId }));

    const created = await tx.playerAchievement.createMany({ data: rows, skipDuplicates: true });
    // When nothing new was created, none were newly unlocked.
    return created.count > 0 ? earnedCodes : [];
  },

  /** Achievements a player has unlocked, newest first, for their profile. */
  async getPlayerAchievements(playerId: string) {
    return prisma.playerAchievement.findMany({
      where: { playerId },
      orderBy: { unlockedAt: 'desc' },
      include: { achievement: true },
    });
  },

  /** Achievements unlocked during a specific match, for the result page. */
  async getUnlockedInMatch(matchId: string) {
    return prisma.playerAchievement.findMany({
      where: { matchId },
      include: { achievement: true, player: true },
    });
  },

  /** Translated display data for a badge code (icon from the definition). */
  display(code: string, t: TranslateFn): { code: string; icon: string; name: string; description: string } {
    const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.code === code);
    return {
      code,
      icon: def?.icon ?? '🏅',
      name: t(`achievement.${code}.name`),
      description: t(`achievement.${code}.desc`),
    };
  },
};
