import { prisma } from '@/lib/prisma';
import type { AuditAction } from '@prisma/client';

export async function logAudit(args: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: args.userId,
        action: args.action,
        entityType: args.entityType,
        entityId: args.entityId,
        beforeJson: args.before ? JSON.stringify(args.before) : null,
        afterJson: args.after ? JSON.stringify(args.after) : null,
        metadata: args.metadata,
      },
    });
  } catch (e) {
    console.error('[audit] failed:', e);
  }
}
