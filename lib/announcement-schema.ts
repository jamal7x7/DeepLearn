import { z } from 'zod';

export const updateAnnouncementSchema = z.object({
  id: z.number(),
  content: z.string().min(2),
  type: z.string().min(2),
  teamId: z.number(),
});

export const reassignAnnouncementSchema = z.object({
  id: z.number(),
  teamIds: z.array(z.number()).min(1),
});

export const sendAnnouncementSchema = z.object({
  content: z.string().min(2, 'Content required'),
  teamIds: z.array(z.number()).min(1, 'At least one team'),
  type: z.enum(['plain', 'mdx']),
  schedule: z
    .string()
    .optional()
    .refine(
      val => !val || new Date(val) > new Date(),
      { message: 'Schedule must be in the future' }
    ),
  importance: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});
