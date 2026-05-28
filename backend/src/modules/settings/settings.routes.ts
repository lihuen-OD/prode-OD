import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { publicSettingsController } from './settings.controller.js';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  body: z.object({
    predictionsCloseAt: z.string().optional(),
    status: z.enum(['OPEN', 'CLOSED', 'FINISHED']).optional(),
    resultsSource: z.enum(['MANUAL', 'API']).optional(),
  }),
});

export const settingsRouter = Router();

settingsRouter.get('/public', asyncHandler(publicSettingsController));

export { updateSettingsSchema };
