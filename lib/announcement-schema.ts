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
