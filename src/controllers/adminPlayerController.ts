import type { Request, Response } from 'express';
import { z } from 'zod';
import { PlayerService, type PlayerStatusFilter } from '../services/playerService';
import { playerSchema } from '../validators/player';
import { logger } from '../utils/logger';
import type { TranslateFn } from '../i18n';

/** Maps Zod issues to translated, per-field messages for the form view. */
function fieldErrors(error: z.ZodError, t: TranslateFn): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !out[field]) out[field] = t(`player.error.${issue.message}`);
  }
  return out;
}

function parseStatus(value: unknown): PlayerStatusFilter {
  return value === 'active' || value === 'inactive' ? value : 'all';
}

export async function list(req: Request, res: Response): Promise<void> {
  const status = parseStatus(req.query.status);
  const players = await PlayerService.list(status);
  res.render('admin/players/list', {
    title: res.locals.t('player.list.title'),
    players,
    status,
  });
}

export function newForm(_req: Request, res: Response): void {
  res.render('admin/players/form', {
    title: res.locals.t('player.new.title'),
    mode: 'create',
    action: '/admin/players',
    values: { name: '', nickname: '', avatarUrl: '', price: 20 },
    errors: {},
  });
}

export async function create(req: Request, res: Response): Promise<void> {
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render('admin/players/form', {
      title: res.locals.t('player.new.title'),
      mode: 'create',
      action: '/admin/players',
      values: req.body,
      errors: fieldErrors(parsed.error, res.locals.t),
    });
    return;
  }
  const player = await PlayerService.create(parsed.data);
  logger.info('Player created', { playerId: player.id, name: player.name });
  res.redirect('/admin/players');
}

export async function editForm(req: Request, res: Response): Promise<void> {
  const player = await PlayerService.getById(req.params.id);
  res.render('admin/players/form', {
    title: res.locals.t('player.edit.title'),
    mode: 'edit',
    action: `/admin/players/${player.id}`,
    values: {
      name: player.name,
      nickname: player.nickname ?? '',
      avatarUrl: player.avatarUrl ?? '',
      price: player.price,
    },
    player,
    errors: {},
  });
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const parsed = playerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).render('admin/players/form', {
      title: res.locals.t('player.edit.title'),
      mode: 'edit',
      action: `/admin/players/${id}`,
      values: req.body,
      player: { id },
      errors: fieldErrors(parsed.error, res.locals.t),
    });
    return;
  }
  const player = await PlayerService.update(id, parsed.data);
  logger.info('Player updated', { playerId: player.id });
  res.redirect('/admin/players');
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await PlayerService.setActive(req.params.id, false);
  logger.info('Player deactivated', { playerId: req.params.id });
  res.redirect('/admin/players');
}

export async function activate(req: Request, res: Response): Promise<void> {
  await PlayerService.setActive(req.params.id, true);
  logger.info('Player activated', { playerId: req.params.id });
  res.redirect('/admin/players');
}
