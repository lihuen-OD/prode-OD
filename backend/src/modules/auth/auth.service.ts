import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { stripPasswordHash } from '../../utils/response.js';
import { logAudit } from '../../utils/audit.js';

function toSafeUser(user: User) {
  return stripPasswordHash(user);
}

export async function loginUser(username: string, password: string) {
  const identifier = username.trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: identifier, mode: 'insensitive' } },
        { email: { equals: identifier, mode: 'insensitive' } },
      ],
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Usuario o contraseña incorrectos', 401);
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw new AppError('Usuario o contraseña incorrectos', 401);
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {

    expiresIn: env.JWT_EXPIRES_IN,
  } as any);

  // Audit admin logins
  try {
    if (user.role === 'ADMIN') {
      // best-effort logging, IP is not available here
      await logAudit('admin_login', user.id, 'User', user.id, undefined, { username });
    }
  } catch (err) {
    // swallow auditing errors
  }
  return {
    token,
    user: toSafeUser(user),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  return user;
}
