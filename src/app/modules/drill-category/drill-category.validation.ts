import { z } from 'zod';

export const drillCategoryValidation = {
  save: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      categoryName: z.string().min(2).optional(),
      subtitle: z.string().min(2),
      cover: z.string().min(1).optional(),
      coverPhoto: z.string().min(1).optional(),
      icon: z.string().min(1),
      accessLevel: z.enum(['free', 'premium', 'Free', 'Premium']).transform((value) =>
        value.toLowerCase() as 'free' | 'premium',
      ),
      accentIcon: z.string().default('baseball-outline').optional(),
    }).refine((data) => data.name || data.categoryName, {
      message: 'Category name is required',
      path: ['name'],
    }).refine((data) => data.cover || data.coverPhoto, {
      message: 'Cover photo is required',
      path: ['cover'],
    }),
  }),
};
