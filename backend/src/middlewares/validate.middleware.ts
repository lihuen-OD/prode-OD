import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const first = result.error.issues[0];
      const path = first?.path?.join('.') || 'body';
      const message = first?.message || 'Datos inválidos';

      const fieldMap: Record<string, string> = {
        'body.fullName': 'Completá tu nombre para continuar.',
        'body.username': 'Completá tu usuario para continuar.',
        'body.password': 'Ingresá una contraseña válida (mínimo 4 caracteres).',
        'body.email': 'Ingresá un email válido.',
        'body.phone': 'Ingresá un número de teléfono válido.',
      };

      const friendly = fieldMap[path] || message;
      const error = new AppError(friendly, 400) as AppError & { fields?: Record<string, string> };
      error.fields = { [path.replace('body.', '')]: friendly };
      return next(error);
    }

    const validatedData = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (validatedData.body !== undefined) {
      req.body = validatedData.body;
    }
    return next();
  };
}
