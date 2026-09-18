import type { Request, Response } from 'express';
import { FantasyService } from '../services/fantasyService';
import { calculateMatchPoints } from '../services/scoringService';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/** Fantasy user dashboard: open matches to enter + your live/finished entries. */
export async function dashboard(req: Request, res: Response): Promise<void> {
  const userId = req.fantasyUser!.sub;
  const [open, entries] = await Promise.all([
    FantasyService.openMatches(),
    FantasyService.myEntries(userId),
  ]);

  // Which open matches the user already has a plan for.
  const entered = new Set<string>();
  for (const m of open) {
    const e = await FantasyService.getEntry(userId, m.id);
    if (e) entered.add(m.id);
  }

  res.render('fantasy/dashboard', {
    title: res.locals.t('fantasy.dashboard.title'),
    open,
    entries,
    entered,
    budget: FantasyService.budget,
    squadSize: FantasyService.squadSize,
  });
}

/** Plan builder (DRAFT) or read-only entry view (LIVE/FINISHED). */
export async function planForm(req: Request, res: Response): Promise<void> {
  const userId = req.fantasyUser!.sub;
  const match = await FantasyService.getMatchForPlan(req.params.id);
  const entry = await FantasyService.getEntry(userId, match.id);
  const editable = match.status === 'DRAFT';

  if (!editable && !entry) {
    res.redirect('/fantasy');
    return;
  }

  const [teamA, teamB] = match.teams;
  const selectedIds = new Set((entry?.picks ?? []).map((p) => p.matchParticipantId));
  const captainId = entry?.picks.find((p) => p.isCaptain)?.matchParticipantId ?? '';

  // Pitch kits for the read-only view (points per player, captain flagged).
  const shortByTeam = new Map(match.teams.map((tm) => [tm.id, tm.shortName]));
  const pitchKits = (entry?.picks ?? []).map((pk) => ({
    name: pk.participant.player.name,
    teamShort: shortByTeam.get(pk.participant.teamId) ?? 'A',
    isCaptain: pk.isCaptain,
    points: calculateMatchPoints(pk.participant),
  }));

  res.render('fantasy/plan', {
    title: res.locals.t('fantasy.plan.title'),
    match,
    teamA,
    teamB,
    rosterA: match.participants.filter((p) => p.teamId === teamA.id),
    rosterB: match.participants.filter((p) => p.teamId === teamB.id),
    selectedIds,
    captainId,
    editable,
    budget: FantasyService.budget,
    squadSize: FantasyService.squadSize,
    livePoints: entry ? FantasyService.computePoints(entry.picks) : 0,
    finalPoints: entry?.points ?? null,
    pitchKits,
    saved: req.query.saved === '1',
    error: null,
  });
}

function renderPlanError(req: Request, res: Response, message: string, status = 400): Promise<void> {
  return (async () => {
    const userId = req.fantasyUser!.sub;
    const match = await FantasyService.getMatchForPlan(req.params.id);
    const entry = await FantasyService.getEntry(userId, match.id);
    const [teamA, teamB] = match.teams;
    // Reflect the user's attempted selection back into the form.
    const attempted = new Set(normalizeIds(req.body.players));
    const captainId = typeof req.body.captain === 'string' ? req.body.captain : '';
    res.status(status).render('fantasy/plan', {
      title: res.locals.t('fantasy.plan.title'),
      match,
      teamA,
      teamB,
      rosterA: match.participants.filter((p) => p.teamId === teamA.id),
      rosterB: match.participants.filter((p) => p.teamId === teamB.id),
      selectedIds: attempted.size ? attempted : new Set((entry?.picks ?? []).map((p) => p.matchParticipantId)),
      captainId,
      editable: match.status === 'DRAFT',
      budget: FantasyService.budget,
      squadSize: FantasyService.squadSize,
      livePoints: 0,
      finalPoints: null,
      saved: false,
      error: message,
    });
  })();
}

function normalizeIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') return [value];
  return [];
}

export async function savePlan(req: Request, res: Response): Promise<void> {
  const userId = req.fantasyUser!.sub;
  const matchId = req.params.id;
  const participantIds = normalizeIds(req.body.players);
  const captain = typeof req.body.captain === 'string' ? req.body.captain : '';

  try {
    await FantasyService.savePlan(userId, matchId, participantIds, captain);
    logger.info('Fantasy plan saved', { userId, matchId });
    res.redirect(`/fantasy/matches/${matchId}/plan?saved=1`);
  } catch (err) {
    if (err instanceof AppError) {
      await renderPlanError(req, res, res.locals.t(err.message), err.statusCode);
      return;
    }
    throw err;
  }
}

/** Fantasy leaderboard (users ranked by total points). */
export async function leaderboard(_req: Request, res: Response): Promise<void> {
  const rows = await FantasyService.getLeaderboard();
  res.render('fantasy/leaderboard', {
    title: res.locals.t('fantasy.leaderboard.title'),
    rows,
  });
}
