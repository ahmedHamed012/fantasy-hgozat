import type { Request, Response } from 'express';
import { FantasyLeagueService } from '../services/fantasyLeagueService';
import { createLeagueSchema, joinLeagueSchema } from '../validators/league';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export async function leagues(req: Request, res: Response): Promise<void> {
  const mine = await FantasyLeagueService.myLeagues(req.fantasyUser!.sub);
  const errKey = typeof req.query.err === 'string' ? req.query.err : null;
  res.render('fantasy/leagues', {
    title: res.locals.t('league.title'),
    mine,
    error: errKey ? res.locals.t(`league.error.${errKey}`) : null,
  });
}

export async function createLeague(req: Request, res: Response): Promise<void> {
  const parsed = createLeagueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.redirect('/fantasy/leagues?err=nameRequired');
    return;
  }
  const league = await FantasyLeagueService.createLeague(req.fantasyUser!.sub, parsed.data.name);
  logger.info('Fantasy league created', { leagueId: league.id, userId: req.fantasyUser!.sub });
  res.redirect(`/fantasy/leagues/${league.id}`);
}

export async function joinLeague(req: Request, res: Response): Promise<void> {
  const parsed = joinLeagueSchema.safeParse(req.body);
  if (!parsed.success) {
    res.redirect('/fantasy/leagues?err=codeRequired');
    return;
  }
  try {
    const league = await FantasyLeagueService.joinByCode(req.fantasyUser!.sub, parsed.data.code);
    logger.info('Fantasy league joined', { leagueId: league.id, userId: req.fantasyUser!.sub });
    res.redirect(`/fantasy/leagues/${league.id}`);
  } catch (err) {
    if (err instanceof AppError) {
      res.redirect('/fantasy/leagues?err=notFound');
      return;
    }
    throw err;
  }
}

export async function standings(req: Request, res: Response): Promise<void> {
  try {
    const data = await FantasyLeagueService.getStandings(req.fantasyUser!.sub, req.params.id);
    const errKey = typeof req.query.err === 'string' ? req.query.err : null;
    res.render('fantasy/league', {
      title: data.league.name,
      league: data.league,
      rows: data.rows,
      isOwner: data.isOwner,
      error: errKey ? res.locals.t(`league.error.${errKey}`) : null,
    });
  } catch (err) {
    if (err instanceof AppError) {
      res.redirect('/fantasy/leagues');
      return;
    }
    throw err;
  }
}

export async function leaveLeague(req: Request, res: Response): Promise<void> {
  try {
    await FantasyLeagueService.leaveLeague(req.fantasyUser!.sub, req.params.id);
    res.redirect('/fantasy/leagues');
  } catch (err) {
    if (err instanceof AppError) {
      res.redirect(`/fantasy/leagues/${req.params.id}?err=ownerLeave`);
      return;
    }
    throw err;
  }
}

export async function deleteLeague(req: Request, res: Response): Promise<void> {
  await FantasyLeagueService.deleteLeague(req.fantasyUser!.sub, req.params.id);
  logger.info('Fantasy league deleted', { leagueId: req.params.id });
  res.redirect('/fantasy/leagues');
}
