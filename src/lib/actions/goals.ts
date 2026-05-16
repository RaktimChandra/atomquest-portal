'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { goalSchema, goalSheetSchema, type GoalInput } from '@/lib/validators';
import { logAudit } from '@/lib/actions/audit';
import type { GoalStatus } from '@prisma/client';

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');
  return session.user;
}

async function getActiveCycleId() {
  const cycle = await prisma.cycle.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!cycle) throw new Error('No active cycle');
  return cycle.id;
}

/** Save an entire goal sheet as DRAFT (upsert per row). Called by autosave + manual save. */
export async function saveDraftSheet(goals: GoalInput[]): Promise<ActionResult<{ ids: string[] }>> {
  try {
    const user = await requireUser();
    const cycleId = await getActiveCycleId();

    // Validate individual goals only (not the sheet sum) so drafts can be partial
    for (const g of goals) {
      const r = goalSchema.safeParse(g);
      if (!r.success) return { ok: false, error: r.error.errors[0]?.message ?? 'Invalid goal' };
    }
    if (goals.length > 8) return { ok: false, error: 'Maximum 8 goals per sheet' };

    // Remove existing DRAFT goals for this user/cycle so we always have a clean snapshot
    await prisma.goal.deleteMany({
      where: { ownerId: user.id, cycleId, status: 'DRAFT' },
    });

    const created = await prisma.$transaction(
      goals.map((g) =>
        prisma.goal.create({
          data: {
            title: g.title,
            description: g.description || null,
            ownerId: user.id,
            cycleId,
            thrustAreaId: g.thrustAreaId,
            uomType: g.uomType,
            uomUnit: g.uomUnit || null,
            target: g.target ?? null,
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
            weightage: g.weightage,
            status: 'DRAFT',
          },
        })
      )
    );

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'GoalSheet',
      entityId: cycleId,
      after: { count: created.length },
      metadata: 'Draft autosave',
    });

    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard');
    return { ok: true, data: { ids: created.map((c) => c.id) } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed to save draft' };
  }
}

/** Submit the entire goal sheet for manager approval. Enforces ∑=100%. */
export async function submitGoalSheet(goals: GoalInput[]): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const cycleId = await getActiveCycleId();

    const parsed = goalSheetSchema.safeParse({ goals });
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Validation failed' };

    // Replace all DRAFT and SUBMITTED-but-not-approved goals with the new submitted sheet
    await prisma.goal.deleteMany({
      where: { ownerId: user.id, cycleId, status: { in: ['DRAFT', 'SUBMITTED', 'RETURNED'] } },
    });

    const now = new Date();
    const created = await prisma.$transaction(
      goals.map((g) =>
        prisma.goal.create({
          data: {
            title: g.title,
            description: g.description || null,
            ownerId: user.id,
            cycleId,
            thrustAreaId: g.thrustAreaId,
            uomType: g.uomType,
            uomUnit: g.uomUnit || null,
            target: g.target ?? null,
            targetDate: g.targetDate ? new Date(g.targetDate) : null,
            weightage: g.weightage,
            status: 'SUBMITTED',
            submittedAt: now,
          },
        })
      )
    );

    // Notify manager
    const me = await prisma.user.findUnique({ where: { id: user.id }, select: { managerId: true, name: true } });
    if (me?.managerId) {
      await prisma.notification.create({
        data: {
          userId: me.managerId,
          type: 'GOAL_SUBMITTED',
          title: 'New goal sheet submitted',
          message: `${me.name} has submitted their goal sheet for approval.`,
          link: `/dashboard/approvals`,
        },
      });
    }

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entityType: 'GoalSheet',
      entityId: cycleId,
      after: { count: created.length, totalWeightage: 100 },
      metadata: 'Goal sheet submitted for approval',
    });

    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed to submit goal sheet' };
  }
}

/** Delete a single DRAFT goal */
export async function deleteDraftGoal(goalId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.ownerId !== user.id) return { ok: false, error: 'Not your goal' };
    if (goal.status !== 'DRAFT') return { ok: false, error: 'Only drafts can be deleted' };

    await prisma.goal.delete({ where: { id: goalId } });
    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Goal',
      entityId: goalId,
      before: { title: goal.title },
    });
    revalidatePath('/dashboard/goals');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed to delete' };
  }
}
