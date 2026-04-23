import { z } from 'zod';

export const paymentValidation = {
  completePurchase: z.object({
    body: z.object({
      email: z.email(),
      country: z.string().min(2),
      purchaseType: z.string().default('Unlock All Drills').optional(),
    }),
  }),
  updatePrice: z.object({
    body: z.object({
      price: z.number().positive(),
    }),
  }),
};
