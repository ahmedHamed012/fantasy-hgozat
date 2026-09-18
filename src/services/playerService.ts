import type { Player, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import type { PlayerInput } from '../validators/player';

export type PlayerStatusFilter = 'all' | 'active' | 'inactive';

/**
 * Player domain logic. Players form a global pool and are never hard-deleted
 * once they have history — deactivation (isActive=false) is used instead so
 * historical match statistics remain intact (spec §6, §35.11).
 */
export const PlayerService = {
  async list(status: PlayerStatusFilter = 'all'): Promise<Player[]> {
    const where: Prisma.PlayerWhereInput =
      status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {};
    return prisma.player.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  },

  /** Players selectable for a new match (active only), ordered by name. */
  async listActive(): Promise<Player[]> {
    return prisma.player.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  },

  async getById(id: string): Promise<Player> {
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) throw AppError.notFound('Player not found.');
    return player;
  },

  async create(input: PlayerInput): Promise<Player> {
    return prisma.player.create({
      data: {
        name: input.name,
        nickname: input.nickname ?? null,
        avatarUrl: input.avatarUrl ?? null,
        price: input.price,
      },
    });
  },

  async update(id: string, input: PlayerInput): Promise<Player> {
    await this.getById(id); // 404 if missing
    return prisma.player.update({
      where: { id },
      data: {
        name: input.name,
        nickname: input.nickname ?? null,
        avatarUrl: input.avatarUrl ?? null,
        price: input.price,
      },
    });
  },

  /** Soft delete / restore. Never removes the row. */
  async setActive(id: string, isActive: boolean): Promise<Player> {
    await this.getById(id);
    return prisma.player.update({ where: { id }, data: { isActive } });
  },

  /** How many matches a player has taken part in (for profile/summary use). */
  async participationCount(id: string): Promise<number> {
    return prisma.matchParticipant.count({ where: { playerId: id } });
  },
};
