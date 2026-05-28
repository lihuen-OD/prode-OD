import type { Request, Response } from 'express';
import { loginUser, getCurrentUser } from './auth.service.js';

export async function loginController(req: Request, res: Response) {
  const { username, password } = req.body;
  const result = await loginUser(username, password);
  res.json(result);
}

export async function meController(req: Request, res: Response) {
  const user = await getCurrentUser(req.auth!.userId);
  res.json({ user });
}
