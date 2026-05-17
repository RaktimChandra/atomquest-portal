'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { computeScore, type UomType } from '@/lib/score-engine';

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const shareSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  thrustAreaId: z.string().min(1),
  uomType: z.enum(['NUMERIC_MIN', 'NUMERIC_MAX', 'PERCENTAGE_MIN', 'PERCENTAGE_MAX', 'TIMELINE', 'ZERO_BASED']),
  uomUnit: z.string().max(40).optional().or(z.literal('')),
  target: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  defaultWeightage: z.number().min(10).max(100),
  recipientIds: z.array(z.string()).min(1, 'Pick at least one recipient'),
  primaryOwnerId: z.string().min(1, 'Pick a primary owner'),
});

/** Create a shared goal: a parent goal owned by primaryOwner + child copies for each recipient. */
export async function createSharedGoal(input: z.infer<typeof shareSchema>): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Unauthenticated' };
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return { ok: false, error: 'Only managers and admins can share goals' };
    }

    const parsed = shareSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) return { ok: false, error: 'No active cycle' };

    if (!input.recipientIds.includes(input.primaryOwnerId)) {
      return { ok: false, error: 'Primary owner must be one of the recipients' };
    }

    // 1. Create parent goal (owned by primary)
    const parent = await prisma.goal.create({
      data: {
        title: input.title,
        description: input.description || null,
        ownerId: input.primaryOwnerId,
        cycleId: cycle.id,
        thrustAreaId: input.thrustAreaId,
        uomType: input.uomType,
        uomUnit: input.uomUnit || null,
        target: input.target ?? null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        weightage: input.defaultWeightage,
        status: 'DRAFT',
        isShared: true,
      },
    });

    // 2. Create child goal copies for each non-primary recipient
    const others = input.recipientIds.filter((id) => id !== input.primaryOwnerId);
    if (others.length > 0) {
      await prisma.$transaction(
        others.map((rid) =>
          prisma.goal.create({
            data: {
              title: input.title,
              description: input.description || null,
              ownerId: rid,
              cycleId: cycle.id,
              thrustAreaId: input.thrustAreaId,
              uomType: input.uomType,
              uomUnit: input.uomUnit || null,
              target: input.target ?? null,
              targetDate: input.targetDate ? new Date(input.targetDate) : null,
              weightage: input.defaultWeightage,
              status: 'DRAFT',
              isShared: true,
              parentGoalId: parent.id,
            },
          })
        )
      );
    }

    // 3. Track recipient links
    await prisma.$transaction(
      input.recipientIds.map((rid) =>
        prisma.sharedGoalRecipient.create({
          data: { goalId: parent.id, userId: rid, weightage: input.defaultWeightage },
        })
      )
    );

    // 4. Notifications
    await prisma.$transaction(
      input.recipientIds.map((rid) =>
        prisma.notification.create({
          data: {
            userId: rid,
            type: 'SHARED_GOAL',
            title: 'A shared goal has been added to your sheet',
            message: session.user.name + ' shared "' + input.title + '" with you. Open your goal sheet to adjust weightage.',
            link: '/dashboard/goals/new',
          },
        })
      )
    );

    // 5. Audit log
    await logAudit({
      userId: session.user.id,
      action: 'SHARE',
      entityType: 'Goal',
      entityId: parent.id,
      after: {
        title: input.title,
        recipientCount: input.recipientIds.length,
        primaryOwnerId: input.primaryOwnerId,
      },
      metadata: 'Shared goal pushed to ' + input.recipientIds.length + ' recipients',
    });

    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard/team');
    revalidatePath('/dashboard');
    return { ok: true, data: { parentId: parent.id, recipientCount: input.recipientIds.length } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Share failed' };
  }
}

/** Sync achievement: when parent goal owner records a check-in, propagate the actual to all children. */
export async function syncSharedAchievement(parentGoalId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Unauthenticated' };

    const parent = await prisma.goal.findUnique({
      where: { id: parentGoalId },
      include: { checkIns: { where: { quarter } }, childGoals: true },
    });
    if (!parent) return { ok: false, error: 'Parent goal not found' };
    if (parent.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return { ok: false, error: 'Only the primary owner can sync' };
    }

    const parentCheckIn = parent.checkIns[0];
    if (!parentCheckIn) return { ok: false, error: 'No check-in yet for ' + quarter };

    // For each child goal, upsert a matching check-in with same actuals
    let synced = 0;
    for (const child of parent.childGoals) {
      const score = computeScore({
        uomType: child.uomType as UomType,
        target: child.target,
        actualValue: parentCheckIn.actualValue,
        targetDate: child.targetDate,
        actualDate: parentCheckIn.actualDate,
      });

      await prisma.checkIn.upsert({
        where: { goalId_quarter: { goalId: child.id, quarter } },
        update: {
          actualValue: parentCheckIn.actualValue,
          actualDate: parentCheckIn.actualDate,
          status: parentCheckIn.status,
          computedScore: score,
          selfComment: '[Auto-synced from primary owner]',
        },
        create: {
          goalId: child.id,
          userId: child.ownerId,
          quarter,
          actualValue: parentCheckIn.actualValue,
          actualDate: parentCheckIn.actualDate,
          status: parentCheckIn.status,
          computedScore: score,
          selfComment: '[Auto-synced from primary owner]',
        },
      });
      synced++;
    }

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'CheckIn',
      entityId: parentGoalId,
      metadata: 'Synced ' + quarter + ' achievement to ' + synced + ' linked goal(s)',
    });

    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard/team');
    return { ok: true, data: { synced } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Sync failed' };
  }
}