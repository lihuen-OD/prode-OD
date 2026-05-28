import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

const FORBIDDEN_FIELDS = ['role', 'points', 'totalPoints', 'isAdmin', 'createdAt', 'updatedAt'];

function stripForbidden(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of FORBIDDEN_FIELDS) {
    if (key in obj) delete obj[key];
  }
  // strip from nested arrays/objects (one level deep for safety)
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object') {
          for (const f of FORBIDDEN_FIELDS) delete item[f];
        }
      }
    } else if (val && typeof val === 'object') {
      for (const f of FORBIDDEN_FIELDS) delete val[f];
    }
  }
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  try {
    // Only allow admins on /api/admin to keep role editing capability there
    const isAdminPath = req.path.startsWith('/admin') || req.originalUrl.startsWith('/api/admin');
    const isAdminUser = Boolean(req.auth && req.auth.role === 'ADMIN');

    if (!isAdminPath || !isAdminUser) {
      if (req.body) stripForbidden(req.body);
      if (req.query) stripForbidden(req.query);
      if (req.params) stripForbidden(req.params);
    }

    return next();
  } catch (err) {
    return next(new AppError('Datos inválidos', 400));
  }
}

export default sanitizeRequest;
