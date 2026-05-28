import type { Request, Response } from 'express';
import { createAdminMatch, deleteAdminMatch, getLastResults, getMatchStats, listAdminMatches, setMatchResult, updateAdminMatch } from './matches.service.js';

export async function listMatchesController(req: Request, res: Response) {
  const { group, status } = req.query as { group?: string; status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' };
  const data = await listAdminMatches({ group, status });
  res.json(data);
}

export async function createMatchController(req: Request, res: Response) {
  const match = await createAdminMatch(req.body);
  res.status(201).json({ match });
}

export async function updateMatchController(req: Request, res: Response) {
  const match = await updateAdminMatch(req.params.id as string, req.body);
  res.json({ match });
}

export async function setResultController(req: Request, res: Response) {
  const match = await setMatchResult(req.params.id as string, req.body.result);
  res.json({ match });
}

export async function deleteMatchController(req: Request, res: Response) {
  await deleteAdminMatch(req.params.id as string);
  res.json({ message: 'Partido eliminado correctamente.' });
}

export async function matchStatsController(_req: Request, res: Response) {
  const stats = await getMatchStats();
  res.json({ stats });
}

export async function lastResultsController(_req: Request, res: Response) {
  const matches = await getLastResults();
  res.json({ matches });
}
