import { z } from 'zod';

export const authValidation = {
  sendOtp: z.object({
    body: z.object({
      email: z.email(),
    }),
  }),
  verifyAppOtp: z.object({
    body: z.object({
      email: z.email(),
      code: z.string().length(4),
    }),
  }),
  adminLogin: z.object({
    body: z.object({
      email: z.email(),
      password: z.string().min(8),
    }),
  }),
  verifyAdminOtp: z.object({
    body: z.object({
      email: z.email(),
      code: z.string().length(4),
    }),
  }),
  resetAdminPassword: z.object({
    body: z
      .object({
        email: z.email(),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
      .refine((value) => value.newPassword === value.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      }),
  }),
};
