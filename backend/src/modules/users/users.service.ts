import bcrypt from 'bcrypt';
import { Prisma, type UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { recalculateRankingSnapshotsWithClient } from '../../utils/ranking.js';
import { getPagination } from '../../utils/pagination.js';
import { stripPasswordHash } from '../../utils/response.js';

const participantSelect = {
  id: true,
  fullName: true,
  username: true,
  phone: true,
  email: true,
  role: true,
  paymentStatus: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
} as const;

async function refreshRankingSnapshots(client: any = prisma) {
  const tournament = await client.tournament.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!tournament) {
    return;
  }

  await recalculateRankingSnapshotsWithClient(tournament.id, client);
}

export async function listAdminUsers(search?: string, page?: string, limit?: string) {
  const pagination = getPagination(page, limit);
  const where: Prisma.UserWhereInput = {
    role: 'USER',
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { username: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      select: participantSelect,
    }),
  ]);

  return {
    users: users.map(user => stripPasswordHash(user)),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.max(Math.ceil(total / pagination.limit), 1),
    },
  };
}

export async function createParticipantUser(data: {
  fullName: string;
  username: string;
  password: string;
  phone?: string;
  email?: string;
  paymentStatus: 'PAID' | 'PENDING';
  isActive: boolean;
  role?: UserRole;
}) {
  if (data.role && data.role !== 'USER') {
    throw new AppError('No podés crear un admin desde esta ruta', 403);
  }

  const existing = await prisma.user.findUnique({ where: { username: data.username } });
  if (existing) {
    throw new AppError('El usuario ya existe', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.$transaction(async transaction => {
    const created = await transaction.user.create({
      data: {
        fullName: data.fullName,
        username: data.username,
        passwordHash,
        phone: data.phone || null,
        email: data.email || null,
        role: 'USER',
        paymentStatus: data.paymentStatus,
        isActive: data.isActive,
      },
      select: participantSelect,
    });

    await refreshRankingSnapshots(transaction);

    return created;
  });

  return stripPasswordHash(user);
}

export async function updateParticipantUser(id: string, data: Partial<{
  fullName: string;
  username: string;
  password: string;
  phone: string | null;
  email: string | null;
  paymentStatus: 'PAID' | 'PENDING';
  isActive: boolean;
}>) {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (current.role !== 'USER') {
    throw new AppError('No se puede editar un admin con esta ruta', 403);
  }

  if (data.username && data.username !== current.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      throw new AppError('El usuario ya existe', 409);
    }
  }

  const updated = await prisma.$transaction(async transaction => {
    const nextPasswordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const user = await transaction.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
        ...(data.email !== undefined ? { email: data.email || null } : {}),
        ...(data.paymentStatus !== undefined ? { paymentStatus: data.paymentStatus } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(nextPasswordHash ? { passwordHash: nextPasswordHash } : {}),
      },
      select: participantSelect,
    });

    await refreshRankingSnapshots(transaction);

    return user;
  });

  return stripPasswordHash(updated);
}

export async function softDeleteUser(id: string) {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) {
    throw new AppError('Usuario no encontrado', 404);
  }

  if (current.role !== 'USER') {
    throw new AppError('No se puede desactivar un admin con esta ruta', 403);
  }

  const updated = await prisma.$transaction(async transaction => {
    const user = await transaction.user.update({
      where: { id },
      data: { isActive: false },
      select: participantSelect,
    });

    await refreshRankingSnapshots(transaction);

    return user;
  });

  return stripPasswordHash(updated);
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: participantSelect,
  });

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  return stripPasswordHash(user);
}

export async function getAdminUserStats() {
  const [totalUsers, paidUsers, pendingUsers, activeUsers] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'USER', paymentStatus: 'PAID' } }),
    prisma.user.count({ where: { role: 'USER', paymentStatus: 'PENDING' } }),
    prisma.user.count({ where: { role: 'USER', isActive: true } }),
  ]);

  return {
    totalUsers,
    paidUsers,
    pendingUsers,
    activeUsers,
  };
}
