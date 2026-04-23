import { z } from 'zod';

const instructionSchema = z.object({
  player: z.string().min(1),
  detail: z.string().min(1),
});

export const situationValidation = {
  save: z.object({
    body: z.object({
      title: z.string().min(2),
      category: z.string().min(1).default('Specific Situations').optional(),
      shortLabel: z.string().min(1).default('SS').optional(),
      image: z.string().min(1),
      displayOrder: z.number().min(0),
      featured: z.boolean(),
      diagramVariant: z.enum(['infield', 'outfield']).default('infield').optional(),
      instructions: z.array(instructionSchema).default([]).optional(),
    }),
  }),
};
