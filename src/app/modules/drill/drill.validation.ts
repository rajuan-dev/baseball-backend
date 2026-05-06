import { z } from 'zod';

import { extractYouTubeVideoId, normalizeYouTubeUrl } from './drill.youtube';

const youtubeUrlSchema = z.preprocess(
  normalizeYouTubeUrl,
  z
    .string()
    .url('Please enter a valid YouTube URL.')
    .refine((value) => {
      const videoId = extractYouTubeVideoId(value);
      return Boolean(videoId);
    }, 'Please enter a valid YouTube URL.')
    .nullable()
    .optional(),
);

const focusPointSchema = z.union([
  z.string().min(1).transform((value) => {
    const [title = '', ...rest] = value.split(':');

    return {
      title: title.trim(),
      description: rest.join(':').trim(),
    };
  }),
  z.object({
    title: z.string().min(1),
    description: z.string().min(1),
  }),
]);

export const drillValidation = {
  save: z.object({
    body: z.object({
      name: z.string().min(2).optional(),
      drillName: z.string().min(2).optional(),
      categoryId: z.string().min(1),
      description: z.string().min(10),
      cover: z.string().min(1).optional(),
      coverPhoto: z.string().min(1).optional(),
      youtubeUrl: youtubeUrlSchema,
      listIcon: z.string().min(1).default('baseball-outline').optional(),
      accessLevel: z.enum(['free', 'premium', 'Free', 'Premium']).transform((value) =>
        value.toLowerCase() as 'free' | 'premium',
      ),
      steps: z.array(z.string().min(1)).min(1, 'At least one step direction is required'),
      equipment: z.array(z.string().min(1)).min(1, 'At least one equipment item is required'),
      focusPoints: z.array(focusPointSchema).min(1, 'At least one focus point is required'),
    }).refine((data) => data.name || data.drillName, {
      message: 'Drill name is required',
      path: ['name'],
    }).refine((data) => data.cover || data.coverPhoto, {
      message: 'Cover photo is required',
      path: ['cover'],
    }),
  }),
};
