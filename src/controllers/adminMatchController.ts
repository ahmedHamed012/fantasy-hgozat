import type { Request, Response } from 'express';
import { z } from 'zod';
import { MatchService, type MatchWithTeamsAndParticipants } from '../services/matchService';
import { PlayerService } from '../services/playerService';
import { LiveMatchService } from '../services/liveMatchService';
import { AchievementService } from '../services/achievementService';
import { computeTeamScores, calculateMatchPoints, isStatKey } from '../services/scoringService';
import { createMatchSchema } from '../validators/match';
import { playerSchema } from '../validators/player';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import type { TranslateFn } from '../i18n';

function fieldErrors(error: z.ZodError, t: TranslateFn, ns: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !out[field]) out[field] = t(`${ns}.${issue.message}`);
  }
  return out;
}

export async function list(_req: Request, res: Response): Promise<void> {
  const matches = await MatchService.list();
  res.render('admin/matches/list', {
    title: res.locals.t('match.list.title'),
    matches,
  });
}

export function newForm(_req: Request, res: Response): void {
  const today = new Date().toISOString().slice(0, 10);
  res.render('admin/matches/new', {
    title: res.locals.t('match.new.title'),
    values: { matchDate: today, title: '' },
    errors: {},
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render('admin/matches/new', {
      title: res.locals.t('match.new.title'),
      values: req.body,
      errors: fieldErrors(parsed.error, res.locals.t, 'match.error'),
    });
    return;
  }
  const match = await MatchService.create(parsed.data, req.user!.sub);
  logger.info('Match created', { matchId: match.id, by: req.user!.sub });
  res.redirect(`/admin/matches/${match.id}/setup`);
}

/** Builds the setup view model: team columns + player rows with assignments. */
export async function setup(req: Request, res: Response): Promise<void> {
  const match = await MatchService.getWithParticipants(req.params.id);
  const [teamA, teamB] = match.teams;

  const assignment = new Map<string, string>();
  for (const p of match.participants) assignment.set(p.playerId, p.teamId);

  // Selectable pool: active players plus anyone already assigned (even if since
  // deactivated), deduped and sorted by name.
  const activePlayers = await PlayerService.listActive();
  const byId = new Map(activePlayers.map((p) => [p.id, p]));
  for (const part of match.participants) byId.set(part.playerId, part.player);
  const players = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));

  const rows = players.map((p) => ({
    player: p,
    teamId: assignment.get(p.id) ?? '',
  }));
  const countA = match.participants.filter((p) => p.teamId === teamA.id).length;
  const countB = match.participants.filter((p) => p.teamId === teamB.id).length;

  res.render('admin/matches/setup', {
    title: res.locals.t('match.setup.title'),
    match,
    teamA,
    teamB,
    rows,
    countA,
    countB,
    saved: req.query.saved === '1',
    err: typeof req.query.err === 'string' ? req.query.err : null,
  });
}

export async function saveParticipants(req: Request, res: Response): Promise<void> {
  const assign = (req.body.assign ?? {}) as Record<string, string>;
  await MatchService.saveParticipants(req.params.id, assign);
  logger.info('Match participants saved', { matchId: req.params.id });
  res.redirect(`/admin/matches/${req.params.id}/setup?saved=1`);
}

/** AJAX: quick-add a new player during setup. Returns JSON for the client. */
export async function quickAddPlayer(req: Request, res: Response): Promise<void> {
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    res.status(400).json({ error: res.locals.t(`player.error.${first?.message ?? 'nameRequired'}`) });
    return;
  }
  const player = await PlayerService.create(parsed.data);
  logger.info('Player quick-added during setup', { playerId: player.id, matchId: req.params.id });
  res.status(201).json({ id: player.id, name: player.name, nickname: player.nickname });
}

export async function start(req: Request, res: Response): Promise<void> {
  try {
    await MatchService.start(req.params.id);
    logger.info('Match started', { matchId: req.params.id });
    res.redirect(`/admin/matches/${req.params.id}/live`);
  } catch (err) {
    if (err instanceof AppError) {
      res.redirect(`/admin/matches/${req.params.id}/setup?err=teams`);
      return;
    }
    throw err;
  }
}

/** The live counter screen. Only meaningful for a LIVE match. */
export async function live(req: Request, res: Response): Promise<void> {
  const match = await MatchService.getWithParticipants(req.params.id);
  if (match.status === 'DRAFT') {
    res.redirect(`/admin/matches/${match.id}/setup`);
    return;
  }
  if (match.status !== 'LIVE') {
    res.redirect(`/admin/matches/${match.id}`);
    return;
  }

  const [teamA, teamB] = match.teams;
  const scores = computeTeamScores(match.teams, match.participants);
  res.render('admin/matches/live', {
    title: match.title || res.locals.t('live.title'),
    match,
    teamA,
    teamB,
    rosterA: match.participants.filter((p) => p.teamId === teamA.id),
    rosterB: match.participants.filter((p) => p.teamId === teamB.id),
    scoreA: scores[teamA.id] ?? 0,
    scoreB: scores[teamB.id] ?? 0,
  });
}

/** Shared handler for increment/decrement AJAX endpoints. */
async function adjust(req: Request, res: Response, delta: 1 | -1): Promise<void> {
  const stat = req.body?.stat;
  if (!isStatKey(stat)) {
    throw AppError.badRequest('Invalid statistic.');
  }
  const result = await LiveMatchService.adjustStat(
    req.params.id,
    req.params.participantId,
    stat,
    delta,
    req.user?.sub ?? null,
  );
  res.json(result);
}

export function increment(req: Request, res: Response): Promise<void> {
  return adjust(req, res, 1);
}

export function decrement(req: Request, res: Response): Promise<void> {
  return adjust(req, res, -1);
}

export async function details(req: Request, res: Response): Promise<void> {
  const match = await MatchService.getWithParticipants(req.params.id);
  const [teamA, teamB] = match.teams;
  const rosterA = match.participants.filter((p) => p.teamId === teamA.id);
  const rosterB = match.participants.filter((p) => p.teamId === teamB.id);
  res.render('admin/matches/details', {
    title: match.title || res.locals.t('match.details.title'),
    match,
    teamA,
    teamB,
    rosterA,
    rosterB,
  });
}

export async function finish(req: Request, res: Response): Promise<void> {
  try {
    await MatchService.finish(req.params.id);
    logger.info('Match finished', { matchId: req.params.id });
    res.redirect(`/admin/matches/${req.params.id}/result`);
  } catch (err) {
    if (err instanceof AppError) {
      // e.g. not LIVE — send them to the current view of the match.
      res.redirect(`/admin/matches/${req.params.id}`);
      return;
    }
    throw err;
  }
}

export async function cancel(req: Request, res: Response): Promise<void> {
  await MatchService.cancel(req.params.id);
  logger.info('Match cancelled', { matchId: req.params.id });
  res.redirect(`/admin/matches/${req.params.id}`);
}

/** Builds a roster row with computed match points, sorted by points desc. */
function scoredRoster(
  participants: MatchWithTeamsAndParticipants['participants'],
  teamId: string,
) {
  return participants
    .filter((p) => p.teamId === teamId)
    .map((p) => ({ ...p, points: calculateMatchPoints(p) }))
    .sort((a, b) => b.points - a.points);
}

export async function result(req: Request, res: Response): Promise<void> {
  const match = await MatchService.getWithParticipants(req.params.id);
  if (match.status === 'DRAFT') {
    res.redirect(`/admin/matches/${match.id}/setup`);
    return;
  }
  if (match.status === 'LIVE') {
    res.redirect(`/admin/matches/${match.id}/live`);
    return;
  }

  const [teamA, teamB] = match.teams;
  const scores = computeTeamScores(match.teams, match.participants);
  const motm = match.participants.filter((p) => p.isMotm);

  // Badges unlocked in this match, with translated display data.
  const unlocked = await AchievementService.getUnlockedInMatch(match.id);
  const newAchievements = unlocked.map((u) => ({
    player: u.player,
    badge: AchievementService.display(u.achievement.code, res.locals.t),
  }));

  res.render('admin/matches/result', {
    title: res.locals.t('result.title'),
    match,
    teamA,
    teamB,
    scoreA: scores[teamA.id] ?? 0,
    scoreB: scores[teamB.id] ?? 0,
    rosterA: scoredRoster(match.participants, teamA.id),
    rosterB: scoredRoster(match.participants, teamB.id),
    motm,
    newAchievements,
  });
}
