import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createMatchSchema, listMatchesSchema, resultMatchSchema, updateMatchSchema } from './matches.schemas.js';
import { createMatchController, deleteMatchController, lastResultsController, listMatchesController, matchStatsController, setResultController, updateMatchController } from './matches.controller.js';

export const matchesRouter = Router();

matchesRouter.use(authMiddleware, requireAdmin);
matchesRouter.get('/stats', asyncHandler(matchStatsController));
matchesRouter.get('/last-results', asyncHandler(lastResultsController));
matchesRouter.get('/', validate(listMatchesSchema), asyncHandler(listMatchesController));
matchesRouter.post('/', validate(createMatchSchema), asyncHandler(createMatchController));
matchesRouter.put('/:id', validate(updateMatchSchema), asyncHandler(updateMatchController));
matchesRouter.put('/:id/result', validate(resultMatchSchema), asyncHandler(setResultController));
matchesRouter.delete('/:id', asyncHandler(deleteMatchController));
