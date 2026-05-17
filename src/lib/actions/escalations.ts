'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');
  if (session.user.role !== 'ADMIN') throw new Error('Admin only');
  return session.user;
}

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(80),
  description: z.string().max(500).optional().or(z.literal('')),
  triggerEvent: z.enum(['GOAL_NOT_SUBMITTED', 'APPROVAL_PENDING', 'CHECKIN_OVERDUE']),
  thresholdDays: z.number().int().min(1).max(90),
  escalateTo: z.enum(['MANAGER', 'SKIP_LEVEL', 'HR']),
  isActive: z.boolean(),
});

export async function saveRule(input: z.infer<typeof ruleSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = ruleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid' };

    const data = {
      name: input.name,
      description: input.description || null,
      triggerEvent: input.triggerEvent,
      thresholdDays: input.thresholdDays,
      escalateTo: input.escalateTo,
      isActive: input.isActive,
    };

    if (input.id) {
      await prisma.escalationRule.update({ where: { id: input.id }, data });
    } else {
      await prisma.escalationRule.create({ data });
    }
    await logAudit({ userId: user.id, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'EscalationRule', entityId: input.id ?? 'new', after: data });
    revalidatePath('/dashboard/escalations');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Save failed' };
  }
}

export async function toggleRule(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.escalationRule.update({ where: { id }, data: { isActive } });
    await logAudit({ userId: user.id, action: 'UPDATE', entityType: 'EscalationRule', entityId: id, after: { isActive } });
    revalidatePath('/dashboard/escalations');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Toggle failed' };
  }
}

export async function deleteRule(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.escalationRule.delete({ where: { id } });
    await logAudit({ userId: user.id, action: 'DELETE', entityType: 'EscalationRule', entityId: id });
    revalidatePath('/dashboard/escalations');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Delete failed' };
  }
}

export async function resolveEscalation(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.escalation.update({ where: { id }, data: { isResolved: true, resolvedAt: new Date() } });
    await logAudit({ userId: user.id, action: 'UPDATE', entityType: 'Escalation', entityId: id, metadata: 'Marked resolved' });
    revalidatePath('/dashboard/escalations');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Resolve failed' };
  }
}

/** Run all active rules: scan the org and create escalations where thresholds are breached. */
export async function runEscalationScan(): Promise<ActionResult<{ created: number; rulesEvaluated: number }>> {
  try {
    const user = await requireAdmin();

    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) return { ok: false, error: 'No active cycle' };

    const activeRules = await prisma.escalationRule.findMany({ where: { isActive: true } });
    if (activeRules.length === 0) return { ok: true, data: { created: 0, rulesEvaluated: 0 } };

    const now = new Date();
    let created = 0;

    for (const rule of activeRules) {
      const thresholdMs = rule.thresholdDays * 24 * 60 * 60 * 1000;

      if (rule.triggerEvent === 'GOAL_NOT_SUBMITTED') {
        // Users with no goals in current cycle past threshold from cycle.goalSettingOpen
        const elapsed = now.getTime() - cycle.goalSettingOpen.getTime();
        if (elapsed < thresholdMs) continue;
        const allUsers = await prisma.user.findMany({
          where: { role: { in: ['EMPLOYEE', 'MANAGER'] } },
          include: { ownedGoals: { where: { cycleId: cycle.id } } },
        });
        for (const u of allUsers) {
          if (u.ownedGoals.length === 0) {
            const exists = await prisma.escalation.findFirst({ where: { ruleId: rule.id, targetUserId: u.id, isResolved: false } });
            if (!exists) {
              await prisma.escalation.create({
                data: {
                  ruleId: rule.id,
                  targetUserId: u.id,
                  reason: u.name + ' has not started a goal sheet ' + rule.thresholdDays + '+ days into the cycle',
                },
              });
              await notifyEscalationTarget(rule.escalateTo, u, rule.name);
              created++;
            }
          }
        }
      }

      if (rule.triggerEvent === 'APPROVAL_PENDING') {
        const cutoff = new Date(now.getTime() - thresholdMs);
        const stuckGoals = await prisma.goal.findMany({
          where: { status: 'SUBMITTED', submittedAt: { lt: cutoff }, cycleId: cycle.id },
          include: { owner: true },
        });
        const seen = new Set<string>();
        for (const g of stuckGoals) {
          if (seen.has(g.ownerId)) continue;
          seen.add(g.ownerId);
          const exists = await prisma.escalation.findFirst({ where: { ruleId: rule.id, targetUserId: g.ownerId, isResolved: false } });
          if (!exists) {
            await prisma.escalation.create({
              data: {
                ruleId: rule.id,
                targetUserId: g.ownerId,
                reason: g.owner.name + "'s goal sheet has been awaiting approval for " + rule.thresholdDays + '+ days',
              },
            });
            await notifyEscalationTarget(rule.escalateTo, g.owner, rule.name);
            created++;
          }
        }
      }

      if (rule.triggerEvent === 'CHECKIN_OVERDUE') {
        // Employees with approved goals but no current-quarter check-in past threshold
        const allUsers = await prisma.user.findMany({
          where: { role: 'EMPLOYEE' },
          include: {
            ownedGoals: {
              where: { cycleId: cycle.id, status: { in: ['APPROVED', 'LOCKED'] } },
              include: { checkIns: true },
            },
          },
        });
        for (const u of allUsers) {
          if (u.ownedGoals.length === 0) continue;
          const missing = u.ownedGoals.filter((g) => g.checkIns.length === 0).length;
          if (missing === u.ownedGoals.length) {
            const exists = await prisma.escalation.findFirst({ where: { ruleId: rule.id, targetUserId: u.id, isResolved: false } });
            if (!exists) {
              await prisma.escalation.create({
                data: {
                  ruleId: rule.id,
                  targetUserId: u.id,
                  reason: u.name + ' has not logged any check-ins this quarter',
                },
              });
              await notifyEscalationTarget(rule.escalateTo, u, rule.name);
              created++;
            }
          }
        }
      }
    }

    await logAudit({
      userId: user.id,
      action: 'ESCALATE',
      entityType: 'EscalationScan',
      entityId: 'manual-run',
      after: { created, rulesEvaluated: activeRules.length },
      metadata: 'Manual escalation scan',
    });

    revalidatePath('/dashboard/escalations');
    return { ok: true, data: { created, rulesEvaluated: activeRules.length } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Scan failed' };
  }
}

async function notifyEscalationTarget(escalateTo: string, targetUser: any, ruleName: string) {
  // Find who to actually notify based on the chain
  let recipientId: string | null = null;
  if (escalateTo === 'MANAGER') {
    recipientId = targetUser.managerId;
  } else if (escalateTo === 'SKIP_LEVEL' && targetUser.managerId) {
    const mgr = await prisma.user.findUnique({ where: { id: targetUser.managerId } });
    recipientId = mgr?.managerId ?? null;
  } else if (escalateTo === 'HR') {
    const hr = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    recipientId = hr?.id ?? null;
  }
  if (!recipientId) return;

  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'ESCALATION',
      title: 'Escalation: ' + ruleName,
      message: 'Action required regarding ' + targetUser.name,
      link: '/dashboard/escalations',
    },
  });
}