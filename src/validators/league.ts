import { z } from 'zod';

export const createLeagueSchema = z.object({
  name: z.string().trim().min(1, 'nameRequired').max(40, 'nameTooLong'),
});

export const joinLeagueSchema = z.object({
  code: z.string().trim().min(1, 'codeRequired').max(12, 'codeInvalid'),
});
