import { describe, it, expect } from 'vitest';
import {
  calculateMatchPoints,
  computeTeamScores,
  determineManOfTheMatch,
} from '../src/services/scoringService';

describe('calculateMatchPoints', () => {
  it('scores each statistic per the configuration', () => {
    expect(calculateMatchPoints({ goals: 3, assists: 0, saves: 0, ownGoals: 0 })).toBe(9);
    expect(calculateMatchPoints({ goals: 0, assists: 2, saves: 0, ownGoals: 0 })).toBe(4);
    expect(calculateMatchPoints({ goals: 0, assists: 0, saves: 5, ownGoals: 0 })).toBe(10);
    expect(calculateMatchPoints({ goals: 0, assists: 0, saves: 0, ownGoals: 1 })).toBe(-2);
  });

  it('combines statistics', () => {
    // 3*3 + 2*2 + 5*2 + 1*-2 = 9 + 4 + 10 - 2 = 21
    expect(calculateMatchPoints({ goals: 3, assists: 2, saves: 5, ownGoals: 1 })).toBe(21);
  });
});

describe('computeTeamScores', () => {
  const teams = [{ id: 'A' }, { id: 'B' }];

  it('sums each team’s normal goals', () => {
    const scores = computeTeamScores(teams, [
      { teamId: 'A', goals: 2, ownGoals: 0 },
      { teamId: 'A', goals: 1, ownGoals: 0 },
      { teamId: 'B', goals: 2, ownGoals: 0 },
    ]);
    expect(scores.A).toBe(3);
    expect(scores.B).toBe(2);
  });

  it('credits an own goal to the opponent, not the scorer’s team', () => {
    const scores = computeTeamScores(teams, [
      { teamId: 'A', goals: 2, ownGoals: 1 }, // A scores 2, also 1 own goal
      { teamId: 'B', goals: 0, ownGoals: 0 },
    ]);
    expect(scores.A).toBe(2); // own goal does NOT add to A
    expect(scores.B).toBe(1); // own goal credited to B
  });
});

describe('determineManOfTheMatch', () => {
  it('picks the highest points', () => {
    expect(
      determineManOfTheMatch([
        { id: 'a', goals: 2, assists: 1, saves: 0, ownGoals: 0 }, // 8
        { id: 'b', goals: 1, assists: 0, saves: 0, ownGoals: 0 }, // 3
      ]),
    ).toEqual(['a']);
  });

  it('returns joint winners when fully tied', () => {
    expect(
      determineManOfTheMatch([
        { id: 'a', goals: 1, assists: 0, saves: 0, ownGoals: 0 },
        { id: 'b', goals: 1, assists: 0, saves: 0, ownGoals: 0 },
      ]).sort(),
    ).toEqual(['a', 'b']);
  });

  it('breaks ties by goals over assists', () => {
    // both 6 points, but a has more goals
    expect(
      determineManOfTheMatch([
        { id: 'a', goals: 2, assists: 0, saves: 0, ownGoals: 0 }, // 6, goals 2
        { id: 'b', goals: 0, assists: 3, saves: 0, ownGoals: 0 }, // 6, goals 0
      ]),
    ).toEqual(['a']);
  });

  it('awards nobody when the top score is not positive', () => {
    expect(
      determineManOfTheMatch([
        { id: 'a', goals: 0, assists: 0, saves: 0, ownGoals: 1 },
        { id: 'b', goals: 0, assists: 0, saves: 0, ownGoals: 0 },
      ]),
    ).toEqual([]);
  });
});
