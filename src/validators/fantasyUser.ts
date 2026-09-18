import { z } from 'zod';

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, 'nameRequired').max(40, 'nameTooLong'),
  email: z.string().trim().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(8, 'passwordShort').max(200, 'passwordLong'),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'emailRequired').email('emailInvalid'),
  password: z.string().min(1, 'passwordRequired'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
