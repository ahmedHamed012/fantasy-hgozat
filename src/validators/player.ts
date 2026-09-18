import { z } from 'zod';

/**
 * Server-side validation for player input. Client-side hints improve UX but the
 * backend is always authoritative (spec §39).
 *
 * Empty optional fields arrive from HTML forms as "" — normalized to undefined
 * so they are stored as NULL rather than empty strings.
 */
const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

export const playerSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(60, 'nameTooLong'),
  nickname: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(40, 'nicknameTooLong').optional(),
  ),
  avatarUrl: z.preprocess(
    emptyToUndefined,
    z.string().trim().url('avatarInvalid').max(500, 'avatarTooLong').optional(),
  ),
});

export type PlayerInput = z.infer<typeof playerSchema>;
