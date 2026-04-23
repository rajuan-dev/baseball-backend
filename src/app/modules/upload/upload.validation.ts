import { z } from 'zod';

export const uploadValidation = {
  presign: z.object({
    body: z.object({
      fileName: z.string().min(1),
      contentType: z.string().min(1),
      folder: z.string().min(1).default('general').optional(),
    }),
  }),
};
