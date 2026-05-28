import { prisma } from '../config/prisma.js';

export async function logAudit(action: string, userId: string | null, entity: string | null, entityId: string | null, ip?: string, meta?: Record<string, unknown>) {
  try {
    // Try to insert using raw SQL so code doesn't depend on generated client model presence
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AuditLog" ("id", "action", "userId", "entity", "entityId", "ip", "meta", "createdAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::jsonb, now())`,
      action,
      userId,
      entity,
      entityId,
      ip || null,
      meta ? JSON.stringify(meta) : null,
    );
  } catch (err) {
    // If AuditLog table doesn't exist or other DB error, fallback to console logging
    console.warn('Audit log failed (table may not exist):', err instanceof Error ? err.message : err);
    console.info('Audit:', { action, userId, entity, entityId, ip, meta });
  }
}

export default logAudit;
