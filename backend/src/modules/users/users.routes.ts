import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createUserSchema, listUsersSchema, updateUserSchema, userIdParamSchema } from './users.schemas.js';
import { createUserController, deleteUserController, getUserController, listUsersController, updateUserController, userStatsController } from './users.controller.js';

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireAdmin);
usersRouter.get('/stats', asyncHandler(userStatsController));
usersRouter.get('/', validate(listUsersSchema), asyncHandler(listUsersController));
usersRouter.post('/', validate(createUserSchema), asyncHandler(createUserController));
usersRouter.get('/:id', validate(userIdParamSchema), asyncHandler(getUserController));
usersRouter.put('/:id', validate(updateUserSchema), asyncHandler(updateUserController));
usersRouter.delete('/:id', validate(userIdParamSchema), asyncHandler(deleteUserController));
