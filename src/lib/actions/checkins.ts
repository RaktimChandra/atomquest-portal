'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { computeScore, type UomType } from '@/lib/score-engine';

type ActionResult<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

const checkInSchema = z.object({
  goalId: z.string(),
  quarter: z.enum(QUARTERS),
  actualValue: z.number().nullable().optional(),
  actualDate: z.string().nullable().optional(),
  status: z.enum(['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'COMPLETED']).optional(),
  selfComment: z.string().max(2000).optional().or(z.literal('')),
});

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthenticated');
  return session.user;
}

/** Employee saves their check-in for a single goal (upsert). */
export async function saveCheckIn(input: z.infer<typeof checkInSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = checkInSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const goal = await prisma.goal.findUnique({ where: { id: input.goalId } });
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.ownerId !== user.id) return { ok: false, error: 'Not your goal' };
    if (goal.status !== 'APPROVED' && goal.status !== 'LOCKED') {
      return { ok: false, error: 'Goal must be approved before check-ins' };
    }

    const score = computeScore({
      uomType: goal.uomType as UomType,
      target: goal.target,
      actualValue: input.actualValue ?? null,
      targetDate: goal.targetDate,
      actualDate: input.actualDate ? new Date(input.actualDate) : null,
    });

    const checkIn = await prisma.checkIn.upsert({
      where: { goalId_quarter: { goalId: input.goalId, quarter: input.quarter } },
      update: {
        actualValue: input.actualValue ?? null,
        actualDate: input.actualDate ? new Date(input.actualDate) : null,
        status: input.status ?? 'ON_TRACK',
        selfComment: input.selfComment || null,
        computedScore: score,
      },
      create: {
        goalId: input.goalId,
        userId: user.id,
        quarter: input.quarter,
        actualValue: input.actualValue ?? null,
        actualDate: input.actualDate ? new Date(input.actualDate) : null,
        status: input.status ?? 'ON_TRACK',
        selfComment: input.selfComment || null,
        computedScore: score,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'CHECKIN',
      entityType: 'CheckIn',
      entityId: checkIn.id,
      after: { actualValue: input.actualValue, status: input.status, computedScore: score },
      metadata: input.quarter + ' check-in saved',
    });

    revalidatePath('/dashboard/checkins');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/team');
    return { ok: true, data: { score } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Save failed' };
  }
}

const managerCheckInSchema = z.object({
  checkInId: z.string(),
  comment: z.string().min(5, 'Comment must be at least 5 characters').max(2000),
  rating: z.number().int().min(1).max(5).optional(),
});

/** Manager logs a structured check-in comment against an employee's check-in. */
export async function saveManagerCheckIn(input: z.infer<typeof managerCheckInSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return { ok: false, error: 'Not authorized' };
    }
    const parsed = managerCheckInSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
    }

    const checkIn = await prisma.checkIn.findUnique({
      where: { id: input.checkInId },
      include: { goal: { include: { owner: true } } },
    });
    if (!checkIn) return { ok: false, error: 'Check-in not found' };
    if (checkIn.goal.owner.managerId !== user.id && user.role !== 'ADMIN') {
      return { ok: false, error: 'Not your report' };
    }

    await prisma.managerCheckIn.upsert({
      where: { checkInId: input.checkInId },
      update: { comment: input.comment, rating: input.rating ?? null },
      create: {
        checkInId: input.checkInId,
        managerId: user.id,
        comment: input.comment,
        rating: input.rating ?? null,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'CHECKIN',
      entityType: 'ManagerCheckIn',
      entityId: input.checkInId,
      after: { comment: input.comment.slice(0, 200), rating: input.rating },
      metadata: 'Manager check-in for ' + checkIn.goal.owner.name,
    });

    revalidatePath('/dashboard/team');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Save failed' };
  }
}