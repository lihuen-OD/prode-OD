import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

export function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Ruta no encontrada', 404));
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const withFields = err as AppError & { fields?: Record<string, string> };
    return res.status(err.statusCode).json({
      message: err.message,
      ...(withFields.fields ? { fields: withFields.fields } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Conflicto: el recurso ya existe' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Recurso no encontrado' });
    }
  }

  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
