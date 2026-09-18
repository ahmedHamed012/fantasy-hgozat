import { z } from 'zod';

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

/** Create-match input: a date (required) and an optional title. */
export const createMatchSchema = z.object({
  matchDate: z.coerce.date({ errorMap: () => ({ message: 'dateInvalid' }) }),
  title: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, 'titleTooLong').optional(),
  ),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
