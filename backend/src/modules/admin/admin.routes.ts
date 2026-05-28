import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { adminDashboardController, adminSettingsController } from './admin.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateSettingsSchema } from '../settings/settings.routes.js';

export const adminRouter = Router();

adminRouter.get('/dashboard', authMiddleware, requireAdmin, asyncHandler(adminDashboardController));
adminRouter.put('/settings', authMiddleware, requireAdmin, validate(updateSettingsSchema), asyncHandler(adminSettingsController));
