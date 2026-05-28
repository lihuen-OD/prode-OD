import { z } from 'zod';

const predictionChoice = z.enum(['HOME', 'DRAW', 'AWAY']);
const matchStatus = z.enum(['SCHEDULED', 'LIVE', 'FINISHED']);

const teamSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().optional().nullable(),
  flagUrl: z.string().optional().nullable(),
});

export const listMatchesSchema = z.object({
  query: z.object({
    group: z.string().optional(),
    status: matchStatus.optional(),
  }).optional(),
});

export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().min(1),
    groupName: z.string().min(1),
    homeTeam: teamSchema,
    awayTeam: teamSchema,
    matchDate: z.string().min(1),
    status: matchStatus.optional().default('SCHEDULED'),
    venue: z.string().optional().nullable(),
  }),
});

export const updateMatchSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    tournamentId: z.string().min(1).optional(),
    groupName: z.string().min(1).optional(),
    homeTeam: teamSchema.optional(),
    awayTeam: teamSchema.optional(),
    matchDate: z.string().min(1).optional(),
    status: matchStatus.optional(),
    venue: z.string().optional().nullable(),
  }),
});

export const resultMatchSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    result: predictionChoice,
  }),
});
