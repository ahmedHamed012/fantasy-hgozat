/**
 * Centralized scoring rules. ALL point and team-score logic lives here so the
 * configuration can change in one place (spec §17) — controllers, views and
 * other services must never compute points inline.
 */

/** Points awarded per statistic. */
export const SCORING = {
  goal: 3,
  assist: 2,
  save: 2,
  ownGoal: -2,
} as const;

/** The four tracked statistics and their MatchEvent type mapping. */
export const STAT_TO_EVENT = {
  goals: 'GOAL',
  assists: 'ASSIST',
  saves: 'SAVE',
  ownGoals: 'OWN_GOAL',
} as const;

export type StatKey = keyof typeof STAT_TO_EVENT;

export const STAT_KEYS: StatKey[] = ['goals', 'assists', 'saves', 'ownGoals'];

export function isStatKey(value: unknown): value is StatKey {
  return typeof value === 'string' && (STAT_KEYS as string[]).includes(value);
}

export interface PlayerStatLine {
  goals: number;
  assists: number;
  saves: number;
  ownGoals: number;
}

/** A player's match points from their stat line. */
export function calculateMatchPoints(stats: PlayerStatLine): number {
  return (
    stats.goals * SCORING.goal +
    stats.assists * SCORING.assist +
    stats.saves * SCORING.save +
    stats.ownGoals * SCORING.ownGoal
  );
}

export interface ParticipantStats extends PlayerStatLine {
  id: string;
}

/**
 * Determines Man of the Match participant id(s) from final stats.
 *
 * Ranking: highest match points, then the tie-break order goals → assists →
 * saves (spec §18). Participants still tied after all tie-breakers are joint
 * MOTM. A scoreless standout (top points ≤ 0) yields no award. Deterministic —
 * never random.
 */
export function determineManOfTheMatch(participants: ParticipantStats[]): string[] {
  if (participants.length === 0) return [];

  const ranked = participants
    .map((p) => ({
      id: p.id,
      points: calculateMatchPoints(p),
      goals: p.goals,
      assists: p.assists,
      saves: p.saves,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goals - a.goals ||
        b.assists - a.assists ||
        b.saves - a.saves,
    );

  const top = ranked[0];
  if (top.points <= 0) return [];

  return ranked
    .filter(
      (p) =>
        p.points === top.points &&
        p.goals === top.goals &&
        p.assists === top.assists &&
        p.saves === top.saves,
    )
    .map((p) => p.id);
}

interface TeamRef {
  id: string;
}
interface ScoringParticipant {
  teamId: string;
  goals: number;
  ownGoals: number;
}

/**
 * Team scores. A team's score is the goals scored by its own players PLUS any
 * own goals scored by opposing players (own goals credit the opponent and never
 * the scorer's own team — spec §15). Returns a map of teamId -> score.
 */
export function computeTeamScores(
  teams: TeamRef[],
  participants: ScoringParticipant[],
): Record<string, number> {
  const goalsByTeam: Record<string, number> = {};
  const ownByTeam: Record<string, number> = {};
  for (const t of teams) {
    goalsByTeam[t.id] = 0;
    ownByTeam[t.id] = 0;
  }
  for (const p of participants) {
    if (goalsByTeam[p.teamId] === undefined) continue;
    goalsByTeam[p.teamId] += p.goals;
    ownByTeam[p.teamId] += p.ownGoals;
  }
  const totalOwn = Object.values(ownByTeam).reduce((a, b) => a + b, 0);

  const scores: Record<string, number> = {};
  for (const t of teams) {
    // own goals from every OTHER team are credited to this team
    scores[t.id] = goalsByTeam[t.id] + (totalOwn - ownByTeam[t.id]);
  }
  return scores;
}
