import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { optionalAuthMiddleware } from '../../middlewares/auth.middleware.js';
import { rankingController } from './ranking.controller.js';

export const rankingRouter = Router();

rankingRouter.get('/', optionalAuthMiddleware, asyncHandler(rankingController));
