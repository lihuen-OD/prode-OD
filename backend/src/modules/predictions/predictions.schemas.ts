import { z } from 'zod';

const predictionChoice = z.enum(['HOME', 'DRAW', 'AWAY']);

export const bulkPredictionsSchema = z.object({
  body: z.object({
    predictions: z.array(z.object({
      matchId: z.string().min(1),
      choice: predictionChoice,
    })).min(1, 'Debes enviar al menos un pronóstico'),
  }),
});

export type BulkPredictionsBody = z.infer<typeof bulkPredictionsSchema>['body'];
