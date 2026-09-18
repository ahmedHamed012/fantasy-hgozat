import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENT_DEFINITIONS,
  type AchievementContext,
} from '../src/services/achievementService';

function def(code: string) {
  const d = ACHIEVEMENT_DEFINITIONS.find((x) => x.code === code);
  if (!d) throw new Error(`missing definition ${code}`);
  return d;
}

function ctx(partial: Partial<AchievementContext>): AchievementContext {
  return {
    match: { goals: 0, assists: 0, saves: 0, ownGoals: 0 },
    career: { points: 0 },
    recentGoals: [],
    ...partial,
  };
}

describe('achievement predicates', () => {
  it('Hat Trick unlocks at 3 goals, not 2', () => {
    expect(def('HAT_TRICK').evaluate(ctx({ match: { goals: 2, assists: 0, saves: 0, ownGoals: 0 } }))).toBe(false);
    expect(def('HAT_TRICK').evaluate(ctx({ match: { goals: 3, assists: 0, saves: 0, ownGoals: 0 } }))).toBe(true);
  });

  it('Double Hat Trick unlocks at 6 goals', () => {
    expect(def('DOUBLE_HAT_TRICK').evaluate(ctx({ match: { goals: 5, assists: 0, saves: 0, ownGoals: 0 } }))).toBe(false);
    expect(def('DOUBLE_HAT_TRICK').evaluate(ctx({ match: { goals: 6, assists: 0, saves: 0, ownGoals: 0 } }))).toBe(true);
  });

  it('Playmaker unlocks at 4 assists', () => {
    expect(def('PLAYMAKER').evaluate(ctx({ match: { goals: 0, assists: 3, saves: 0, ownGoals: 0 } }))).toBe(false);
    expect(def('PLAYMAKER').evaluate(ctx({ match: { goals: 0, assists: 4, saves: 0, ownGoals: 0 } }))).toBe(true);
  });

  it('Wall unlocks at 10 saves', () => {
    expect(def('WALL').evaluate(ctx({ match: { goals: 0, assists: 0, saves: 9, ownGoals: 0 } }))).toBe(false);
    expect(def('WALL').evaluate(ctx({ match: { goals: 0, assists: 0, saves: 10, ownGoals: 0 } }))).toBe(true);
  });

  it('Century unlocks at 100 career points', () => {
    expect(def('CENTURY').evaluate(ctx({ career: { points: 99 } }))).toBe(false);
    expect(def('CENTURY').evaluate(ctx({ career: { points: 100 } }))).toBe(true);
  });

  it('On Fire needs 5 consecutive scoring matches', () => {
    expect(def('ON_FIRE').evaluate(ctx({ recentGoals: [1, 1, 1, 1] }))).toBe(false); // only 4
    expect(def('ON_FIRE').evaluate(ctx({ recentGoals: [1, 1, 1, 1, 1] }))).toBe(true);
    expect(def('ON_FIRE').evaluate(ctx({ recentGoals: [1, 0, 1, 1, 1] }))).toBe(false); // a gap breaks it
  });
});
