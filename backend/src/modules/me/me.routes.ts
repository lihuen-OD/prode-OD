import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { bulkMePredictionsSchema } from './me.schemas.js';
import { bulkMePredictionsController, meDashboardController } from './me.controller.js';

export const meRouter = Router();

meRouter.get('/dashboard', authMiddleware, asyncHandler(meDashboardController));
meRouter.put('/predictions/bulk', authMiddleware, validate(bulkMePredictionsSchema), asyncHandler(bulkMePredictionsController));
