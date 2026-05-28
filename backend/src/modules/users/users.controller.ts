import type { Request, Response } from 'express';
import { createParticipantUser, getAdminUserStats, getUserById, listAdminUsers, softDeleteUser, updateParticipantUser } from './users.service.js';

export async function listUsersController(req: Request, res: Response) {
  const { page, limit, search } = req.query as { page?: string; limit?: string; search?: string };
  const data = await listAdminUsers(search, page, limit);
  res.json(data);
}

export async function createUserController(req: Request, res: Response) {
  const user = await createParticipantUser(req.body);
  res.status(201).json({ user });
}

export async function updateUserController(req: Request, res: Response) {
  const user = await updateParticipantUser(req.params.id as string, req.body);
  res.json({ user });
}

export async function deleteUserController(req: Request, res: Response) {
  const user = await softDeleteUser(req.params.id as string);
  res.json({ user });
}

export async function getUserController(req: Request, res: Response) {
  const user = await getUserById(req.params.id as string);
  res.json({ user });
}

export async function userStatsController(_req: Request, res: Response) {
  const stats = await getAdminUserStats();
  res.json({ stats });
}
