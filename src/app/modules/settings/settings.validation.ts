import { z } from 'zod';

export const settingsValidation = {
  updateContent: z.object({
    body: z.object({
      value: z.string().min(1),
    }),
  }),
  updateAppSettings: z.object({
    body: z.object({
      homeEyebrow: z.string().min(1).optional(),
      homeTitle: z.string().min(1).optional(),
      homePrimaryCta: z.string().min(1).optional(),
      homeSecondaryCta: z.string().min(1).optional(),
      featuredSectionTitle: z.string().min(1).optional(),
      featuredSectionSubtitle: z.string().min(1).optional(),
      situationImageUri: z.string().nullable().optional(),
    }),
  }),
};
