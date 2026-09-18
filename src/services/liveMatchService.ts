import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { computeTeamScores, STAT_TO_EVENT, type StatKey } from './scoringService';
import { MatchService, type MatchWithTeamsAndParticipants } from './matchService';

export interface StatUpdateResult {
  participantId: string;
  stat: StatKey;
  value: number;
  /** teamId -> current score, after the change. */
  scores: Record<string, number>;
}

/**
 * Live-match statistic recording. Every change is persisted immediately with an
 * atomic, server-authoritative DB operation (increment/decrement — never "set
 * to N" from a client value) and mirrored into the append-only MatchEvent
 * history. Counters can never go negative, and only LIVE matches accept updates.
 */
export const LiveMatchService = {
  /** Loads the live view model (match + teams + participants + scores). */
  async getView(matchId: string): Promise<{
    match: MatchWithTeamsAndParticipants;
    scores: Record<string, number>;
  }> {
    const match = await MatchService.getWithParticipants(matchId);
    const scores = computeTeamScores(match.teams, match.participants);
    return { match, scores };
  },

  /**
   * Adjusts one statistic by +1 or -1 for a participant.
   *
   * - Verifies the match is LIVE and the participant belongs to it.
   * - Increments atomically; decrements only when the value is >= 1 (guarded in
   *   the WHERE clause) so it can never go negative and is race-safe.
   * - Records a MatchEvent (value +1 / -1) for auditing/corrections.
   * - Returns the new value and both team scores for the UI to apply.
   */
  async adjustStat(
    matchId: string,
    participantId: string,
    stat: StatKey,
    delta: 1 | -1,
    userId: string | null,
  ): Promise<StatUpdateResult> {
    const participant = await prisma.matchParticipant.findUnique({
      where: { id: participantId },
      include: { match: { select: { id: true, status: true } } },
    });

    if (!participant || participant.matchId !== matchId) {
      throw AppError.notFound('Player is not part of this match.');
    }
    if (participant.match.status !== 'LIVE') {
      throw AppError.badRequest('Match is no longer live.');
    }

    await prisma.$transaction(async (tx) => {
      if (delta === 1) {
        await tx.matchParticipant.update({
          where: { id: participantId },
          data: { [stat]: { increment: 1 } },
        });
        await tx.matchEvent.create({
          data: {
            matchId,
            matchParticipantId: participantId,
            type: STAT_TO_EVENT[stat],
            value: 1,
            createdById: userId,
          },
        });
      } else {
        // Guarded decrement — only applies when the counter is at least 1.
        const res = await tx.matchParticipant.updateMany({
          where: { id: participantId, [stat]: { gte: 1 } },
          data: { [stat]: { decrement: 1 } },
        });
        if (res.count > 0) {
          await tx.matchEvent.create({
            data: {
              matchId,
              matchParticipantId: participantId,
              type: STAT_TO_EVENT[stat],
              value: -1,
              createdById: userId,
            },
          });
        }
      }
    });

    // Re-read the affected match's counters to return the fresh value + scores.
    const participants = await prisma.matchParticipant.findMany({
      where: { matchId },
      select: { id: true, teamId: true, goals: true, assists: true, saves: true, ownGoals: true },
    });
    const teams = await prisma.matchTeam.findMany({ where: { matchId }, select: { id: true } });

    const me = participants.find((p) => p.id === participantId);
    const value = me ? (me[stat] as number) : 0;
    const scores = computeTeamScores(teams, participants);

    return { participantId, stat, value, scores };
  },
};
