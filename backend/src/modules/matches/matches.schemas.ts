import { z } from 'zod';

const predictionChoice = z.enum(['HOME', 'DRAW', 'AWAY']);
const matchStatus = z.enum(['OPEN', 'LOCKED', 'FINISHED']);
const matchPhase = z.enum(['GROUP', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL']);
const predictionType = z.enum(['RESULT_1X2', 'QUALIFIER']);

const teamSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().optional().nullable(),
  flagUrl: z.string().optional().nullable(),
});

export const listMatchesSchema = z.object({
  query: z.object({
    group: z.string().optional(),
    phase: matchPhase.optional(),
    status: matchStatus.optional(),
  }).optional(),
});

export const createMatchSchema = z.object({
  body: z.object({
    tournamentId: z.string().min(1),
    groupName: z.string().optional().nullable(),
    phase: matchPhase,
    predictionType: predictionType.optional(),
    homeTeam: teamSchema.optional().nullable(),
    awayTeam: teamSchema.optional().nullable(),
    startTime: z.string().min(1).optional(),
    matchDate: z.string().min(1).optional(),
    status: matchStatus.optional().default('OPEN'),
    venue: z.string().optional().nullable(),
    homePlaceholder: z.string().optional().nullable(),
    awayPlaceholder: z.string().optional().nullable(),
  }),
});

export const updateMatchSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    tournamentId: z.string().min(1).optional(),
    groupName: z.string().min(1).optional().nullable(),
    phase: matchPhase.optional(),
    predictionType: predictionType.optional(),
    homeTeam: teamSchema.optional().nullable(),
    awayTeam: teamSchema.optional().nullable(),
    startTime: z.string().min(1).optional(),
    matchDate: z.string().min(1).optional(),
    status: matchStatus.optional(),
    venue: z.string().optional().nullable(),
    homePlaceholder: z.string().optional().nullable(),
    awayPlaceholder: z.string().optional().nullable(),
  }),
});

export const resultMatchSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    homeScore: z.number().int().min(0),
    awayScore: z.number().int().min(0),
    winnerTeamId: z.string().optional().nullable(),
  }),
});
