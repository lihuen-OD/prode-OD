import type { Request, Response } from 'express';
import { getMeDashboard, saveBulkPredictions } from './me.service.js';

export async function meDashboardController(req: Request, res: Response) {
  const data = await getMeDashboard(req.auth!.userId);
  res.json(data);
}

export async function bulkMePredictionsController(req: Request, res: Response) {
  const data = await saveBulkPredictions(req.auth!.userId, req.body.predictions);
  res.json(data);
}
