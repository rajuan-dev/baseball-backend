import { z } from 'zod';

export const drillCategoryValidation = {
  save: z.object({
    body: z.object({
      name: z.string().min(2),
      subtitle: z.string().min(2),
      cover: z.string().min(1),
      icon: z.string().min(1),
      accessLevel: z.enum(['free', 'premium', 'Free', 'Premium']).transform((value) =>
        value.toLowerCase() as 'free' | 'premium',
      ),
      accentIcon: z.string().default('baseball-outline').optional(),
    }),
  }),
};
