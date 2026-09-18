import { describe, it, expect } from 'vitest';
import { MatchService } from '../src/services/matchService';
import { AppError } from '../src/utils/AppError';

/**
 * Match lifecycle transitions are guarded by MatchService.assertStatus (a pure
 * check). These tests confirm the guard accepts the valid state and rejects
 * invalid ones with an operational error — without touching the database.
 */
describe('match lifecycle guard', () => {
  it('allows the expected status', () => {
    expect(() =>
      MatchService.assertStatus({ status: 'DRAFT' }, 'DRAFT', 'nope'),
    ).not.toThrow();
    expect(() =>
      MatchService.assertStatus({ status: 'LIVE' }, 'LIVE', 'nope'),
    ).not.toThrow();
  });

  it('rejects an invalid transition with an AppError', () => {
    // e.g. trying to change teams (requires DRAFT) on a LIVE match
    expect(() => MatchService.assertStatus({ status: 'LIVE' }, 'DRAFT', 'draft only')).toThrow(
      AppError,
    );
    // e.g. finishing (requires LIVE) a DRAFT match
    expect(() => MatchService.assertStatus({ status: 'DRAFT' }, 'LIVE', 'live only')).toThrow(
      'live only',
    );
    // e.g. starting (requires DRAFT) an already FINISHED match
    expect(() => MatchService.assertStatus({ status: 'FINISHED' }, 'DRAFT', 'draft only')).toThrow(
      AppError,
    );
  });
});
