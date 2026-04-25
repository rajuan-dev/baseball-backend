import { z } from 'zod';

export const drillValidation = {
  save: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      drillName: z.string().min(2).optional(),
      categoryId: z.string().min(1),
      description: z.string().min(10),
      cover: z.string().min(1).optional(),
      coverPhoto: z.string().min(1).optional(),
      accessLevel: z.enum(['free', 'premium', 'Free', 'Premium']).transform((value) =>
        value.toLowerCase() as 'free' | 'premium',
      ),
      steps: z.array(z.string().min(1)).default([]).optional(),
      equipment: z.array(z.string().min(1)).default([]).optional(),
      focusPoints: z.array(z.string().min(1)).default([]).optional(),
    }).refine((data) => data.name || data.drillName, {
      message: 'Drill name is required',
      path: ['name'],
    }).refine((data) => data.cover || data.coverPhoto, {
      message: 'Cover photo is required',
      path: ['cover'],
    }),
  }),
};
