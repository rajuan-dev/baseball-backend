import { z } from 'zod';

export const reportValidation = {
  create: z.object({
    body: z.object({
      user: z.string().min(2).default('Mobile User').optional(),
      email: z.email(),
      phone: z.string().default('').optional(),
      city: z.string().default('Marietta').optional(),
      title: z.string().min(3),
      message: z.string().min(10),
    }),
  }),
  updateStatus: z.object({
    body: z.object({
      status: z.enum(['open', 'resolved', 'Open', 'Resolved']),
    }),
  }),
};
