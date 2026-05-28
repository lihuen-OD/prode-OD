import type { Request, Response } from 'express';
import { getRanking } from './ranking.service.js';

export async function rankingController(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 100);
  const data = await getRanking(limit, req.auth?.userId);
  res.json(data);
}
