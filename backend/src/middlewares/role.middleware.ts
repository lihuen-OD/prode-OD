import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import type { UserRole } from '@prisma/client';

export function requireRole(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError('No autenticado', 401));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new AppError('Sin permisos suficientes', 403));
    }

    return next();
  };
}

export const requireAdmin = requireRole(['ADMIN']);
