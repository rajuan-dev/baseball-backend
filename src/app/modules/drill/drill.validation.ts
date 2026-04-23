import { z } from 'zod';

export const drillValidation = {
  save: z.object({
    body: z.object({
      name: z.string().min(2),
      categoryId: z.string().min(1),
      description: z.string().min(10),
      cover: z.string().min(1),
      accessLevel: z.enum(['free', 'premium', 'Free', 'Premium']).transform((value) =>
        value.toLowerCase() as 'free' | 'premium',
      ),
      steps: z.array(z.string().min(1)).default([]).optional(),
      equipment: z.array(z.string().min(1)).default([]).optional(),
      focusPoints: z.array(z.string().min(1)).default([]).optional(),
    }),
  }),
};
