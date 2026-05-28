import type { Request, Response } from 'express';
import { getPublicSettings, updateAdminSettings } from './settings.service.js';

export async function publicSettingsController(_req: Request, res: Response) {
  const settings = await getPublicSettings();
  res.json(settings);
}

export async function updateSettingsController(req: Request, res: Response) {
  const settings = await updateAdminSettings(req.body);
  res.json(settings);
}
