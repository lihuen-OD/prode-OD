import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import type { UserRole } from '@prisma/client';

export interface JwtPayloadData {
  userId: string;
  role: UserRole;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('No autenticado', 401));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayloadData;
    req.auth = { userId: payload.userId, role: payload.role };
    return next();
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayloadData;
    req.auth = { userId: payload.userId, role: payload.role };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  return next();
}
