'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { z } from 'zod';

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireManager() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') throw new Error('Not authorized');
  return session.user;
}

const editSchema = z.object({
  goalId: z.string(),
  title: z.string().min(3).max(120).optional(),
  target: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  weightage: z.number().min(10).max(100).optional(),
});

/** Manager edits a goal inline during approval review (still SUBMITTED state). */
export async function editSubmittedGoal(input: z.infer<typeof editSchema>): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const parsed = editSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const goal = await prisma.goal.findUnique({ where: { id: input.goalId }, include: { owner: true } });
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.owner.managerId !== user.id && user.role !== 'ADMIN') {
      return { ok: false, error: 'Not your report' };
    }
    if (goal.status !== 'SUBMITTED') {
      return { ok: false, error: 'Can only edit submitted goals' };
    }

    const before = {
      title: goal.title,
      target: goal.target,
      targetDate: goal.targetDate,
      weightage: goal.weightage,
    };

    const updated = await prisma.goal.update({
      where: { id: input.goalId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.target !== undefined && { target: input.target }),
        ...(input.targetDate !== undefined && { targetDate: input.targetDate ? new Date(input.targetDate) : null }),
        ...(input.weightage !== undefined && { weightage: input.weightage }),
      },
    });

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Goal',
      entityId: input.goalId,
      before,
      after: {
        title: updated.title,
        target: updated.target,
        targetDate: updated.targetDate,
        weightage: updated.weightage,
      },
      metadata: 'Manager inline edit during approval',
    });

    revalidatePath('/dashboard/approvals');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Edit failed' };
  }
}

/** Approve all submitted goals for one employee + lock them. */
export async function approveEmployeeSheet(employeeId: string): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) return { ok: false, error: 'Employee not found' };
    if (employee.managerId !== user.id && user.role !== 'ADMIN') {
      return { ok: false, error: 'Not your report' };
    }

    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) return { ok: false, error: 'No active cycle' };

    const submitted = await prisma.goal.findMany({
      where: { ownerId: employeeId, cycleId: cycle.id, status: 'SUBMITTED' },
    });
    if (submitted.length === 0) return { ok: false, error: 'Nothing to approve' };

    const total = submitted.reduce((s, g) => s + g.weightage, 0);
    if (Math.abs(total - 100) > 0.01) {
      return { ok: false, error: 'Total weightage is ' + total + '%, must equal 100%' };
    }

    const now = new Date();

    await prisma.$transaction(
      submitted.map((g) =>
        prisma.goal.update({
          where: { id: g.id },
          data: {
            status: 'APPROVED',
            approvedAt: now,
            approverId: user.id,
            lockedAt: now,
            rejectionReason: null,
          },
        })
      )
    );

    await logAudit({
      userId: user.id,
      action: 'APPROVE',
      entityType: 'GoalSheet',
      entityId: employeeId,
      after: { approvedCount: submitted.length, totalWeightage: total },
      metadata: 'Approved ' + submitted.length + ' goals for ' + employee.name,
    });

    await prisma.$transaction(
      submitted.map((g) =>
        prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOCK',
            entityType: 'Goal',
            entityId: g.id,
            afterJson: JSON.stringify({ status: 'APPROVED', lockedAt: now }),
            metadata: 'Goal locked on approval',
          },
        })
      )
    );

    await prisma.notification.create({
      data: {
        userId: employeeId,
        type: 'GOAL_APPROVED',
        title: 'Your goal sheet has been approved',
        message: user.name + ' approved your goal sheet. Goals are now locked for the cycle.',
        link: '/dashboard/goals',
      },
    });

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Approval failed' };
  }
}

/** Return the entire sheet for rework with a mandatory reason. */
export async function returnEmployeeSheet(employeeId: string, reason: string): Promise<ActionResult> {
  try {
    const user = await requireManager();

    if (!reason || reason.trim().length < 5) {
      return { ok: false, error: 'Reason must be at least 5 characters' };
    }

    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) return { ok: false, error: 'Employee not found' };
    if (employee.managerId !== user.id && user.role !== 'ADMIN') {
      return { ok: false, error: 'Not your report' };
    }

    const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
    if (!cycle) return { ok: false, error: 'No active cycle' };

    const submitted = await prisma.goal.findMany({
      where: { ownerId: employeeId, cycleId: cycle.id, status: 'SUBMITTED' },
    });
    if (submitted.length === 0) return { ok: false, error: 'Nothing to return' };

    await prisma.$transaction(
      submitted.map((g) =>
        prisma.goal.update({
          where: { id: g.id },
          data: { status: 'RETURNED', rejectionReason: reason.trim() },
        })
      )
    );

    await logAudit({
      userId: user.id,
      action: 'RETURN',
      entityType: 'GoalSheet',
      entityId: employeeId,
      after: { reason: reason.trim() },
      metadata: 'Returned ' + submitted.length + ' goals for rework',
    });

    await prisma.notification.create({
      data: {
        userId: employeeId,
        type: 'GOAL_RETURNED',
        title: 'Your goal sheet was returned for rework',
        message: user.name + ' requested changes. Reason: ' + reason.trim().slice(0, 200),
        link: '/dashboard/goals/new',
      },
    });

    revalidatePath('/dashboard/approvals');
    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Return failed' };
  }
}