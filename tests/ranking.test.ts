import { describe, it, expect } from 'vitest';
import { compareRankRows, type RankableRow } from '../src/services/rankingService';

const row = (name: string, points: number, goals = 0, assists = 0, matches = 0): RankableRow => ({
  points,
  goals,
  assists,
  matches,
  player: { name },
});

describe('leaderboard ordering', () => {
  it('orders by points descending', () => {
    const rows = [row('A', 10), row('B', 30), row('C', 20)];
    const names = [...rows].sort(compareRankRows).map((r) => r.player.name);
    expect(names).toEqual(['B', 'C', 'A']);
  });

  it('breaks a points tie by goals, then assists, then matches', () => {
    const rows = [
      row('SameLow', 10, 2, 1, 5),
      row('SameHighGoals', 10, 5, 0, 3),
      row('SameMidGoals', 10, 3, 9, 9),
    ];
    const names = [...rows].sort(compareRankRows).map((r) => r.player.name);
    expect(names).toEqual(['SameHighGoals', 'SameMidGoals', 'SameLow']);
  });

  it('is deterministic by name when everything else ties', () => {
    const rows = [row('Zed', 5, 1, 1, 1), row('Amr', 5, 1, 1, 1)];
    const names = [...rows].sort(compareRankRows).map((r) => r.player.name);
    expect(names).toEqual(['Amr', 'Zed']);
  });
});
