import type { Request, Response } from 'express';
import { getAdminDashboard } from './admin.service.js';
import { updateAdminSettings } from '../settings/settings.service.js';

export async function adminDashboardController(_req: Request, res: Response) {
  const data = await getAdminDashboard();
  res.json(data);
}

export async function adminSettingsController(req: Request, res: Response) {
  const settings = await updateAdminSettings(req.body);
  res.json(settings);
}
