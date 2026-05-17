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
  if (session.user.role !== 'ADMIN') throw new Error('Admin access required');
  return session.user;
}

// ============ CYCLE MANAGEMENT ============

const cycleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(60),
  fiscalYear: z.string().min(3).max(20),
  goalSettingOpen: z.string(),
  goalSettingClose: z.string(),
  q1Open: z.string(),
  q1Close: z.string(),
  q2Open: z.string(),
  q2Close: z.string(),
  q3Open: z.string(),
  q3Close: z.string(),
  q4Open: z.string(),
  q4Close: z.string(),
});

export async function saveCycle(input: z.infer<typeof cycleSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = cycleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };

    const data = {
      name: input.name,
      fiscalYear: input.fiscalYear,
      goalSettingOpen: new Date(input.goalSettingOpen),
      goalSettingClose: new Date(input.goalSettingClose),
      q1Open: new Date(input.q1Open),
      q1Close: new Date(input.q1Close),
      q2Open: new Date(input.q2Open),
      q2Close: new Date(input.q2Close),
      q3Open: new Date(input.q3Open),
      q3Close: new Date(input.q3Close),
      q4Open: new Date(input.q4Open),
      q4Close: new Date(input.q4Close),
    };

    let cycle;
    if (input.id) {
      const before = await prisma.cycle.findUnique({ where: { id: input.id } });
      cycle = await prisma.cycle.update({ where: { id: input.id }, data });
      await logAudit({ userId: user.id, action: 'UPDATE', entityType: 'Cycle', entityId: cycle.id, before, after: cycle, metadata: 'Cycle config updated' });
    } else {
      cycle = await prisma.cycle.create({ data: { ...data, phase: 'GOAL_SETTING' } });
      await logAudit({ userId: user.id, action: 'CREATE', entityType: 'Cycle', entityId: cycle.id, after: cycle, metadata: 'New cycle created' });
    }

    revalidatePath('/dashboard/cycles');
    return { ok: true, data: { id: cycle.id } };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Save failed' };
  }
}

export async function setActiveCycle(cycleId: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    await prisma.cycle.updateMany({ where: { isActive: true }, data: { isActive: false } });
    await prisma.cycle.update({ where: { id: cycleId }, data: { isActive: true } });
    await logAudit({ userId: user.id, action: 'UPDATE', entityType: 'Cycle', entityId: cycleId, metadata: 'Set as active cycle' });
    revalidatePath('/dashboard/cycles');
    revalidatePath('/dashboard');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Activation failed' };
  }
}

// ============ THRUST AREAS ============

const thrustAreaSchema = z.object({
  id: z.string().optional(),
  cycleId: z.string(),
  name: z.string().min(2).max(60),
  description: z.string().max(200).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be hex like #6366f1'),
});

export async function saveThrustArea(input: z.infer<typeof thrustAreaSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = thrustAreaSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };

    let area;
    if (input.id) {
      area = await prisma.thrustArea.update({
        where: { id: input.id },
        data: { name: input.name, description: input.description || null, color: input.color },
      });
    } else {
      area = await prisma.thrustArea.create({
        data: { cycleId: input.cycleId, name: input.name, description: input.description || null, color: input.color },
      });
    }
    await logAudit({ userId: user.id, action: input.id ? 'UPDATE' : 'CREATE', entityType: 'ThrustArea', entityId: area.id, after: area });
    revalidatePath('/dashboard/cycles');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Save failed' };
  }
}

export async function deleteThrustArea(id: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const inUse = await prisma.goal.count({ where: { thrustAreaId: id } });
    if (inUse > 0) return { ok: false, error: 'Cannot delete — ' + inUse + ' goals are using this area' };
    await prisma.thrustArea.delete({ where: { id } });
    await logAudit({ userId: user.id, action: 'DELETE', entityType: 'ThrustArea', entityId: id });
    revalidatePath('/dashboard/cycles');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Delete failed' };
  }
}

// ============ ORG HIERARCHY ============

const updateUserSchema = z.object({
  userId: z.string(),
  managerId: z.string().nullable().optional(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional(),
  department: z.string().max(60).nullable().optional(),
  designation: z.string().max(80).nullable().optional(),
});

export async function updateUser(input: z.infer<typeof updateUserSchema>): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };

    if (input.managerId === input.userId) return { ok: false, error: 'Cannot self-manage' };

    const before = await prisma.user.findUnique({ where: { id: input.userId } });
    const updated = await prisma.user.update({
      where: { id: input.userId },
      data: {
        ...(input.managerId !== undefined && { managerId: input.managerId }),
        ...(input.role && { role: input.role }),
        ...(input.department !== undefined && { department: input.department }),
        ...(input.designation !== undefined && { designation: input.designation }),
      },
    });

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'User',
      entityId: updated.id,
      before: { managerId: before?.managerId, role: before?.role, department: before?.department, designation: before?.designation },
      after: { managerId: updated.managerId, role: updated.role, department: updated.department, designation: updated.designation },
      metadata: 'Admin org-hierarchy edit',
    });

    revalidatePath('/dashboard/org');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Update failed' };
  }
}

// ============ ADMIN UNLOCK ============

export async function adminUnlockGoal(goalId: string, reason: string): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    if (!reason || reason.trim().length < 5) return { ok: false, error: 'Reason must be at least 5 characters' };

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return { ok: false, error: 'Goal not found' };
    if (goal.status !== 'APPROVED' && goal.status !== 'LOCKED') return { ok: false, error: 'Goal is not locked' };

    const before = { status: goal.status, lockedAt: goal.lockedAt };
    await prisma.goal.update({
      where: { id: goalId },
      data: { status: 'RETURNED', lockedAt: null, rejectionReason: 'Admin unlock: ' + reason.trim() },
    });

    await logAudit({
      userId: user.id,
      action: 'UNLOCK',
      entityType: 'Goal',
      entityId: goalId,
      before,
      after: { status: 'RETURNED' },
      metadata: 'Admin unlock reason: ' + reason.trim(),
    });

    await prisma.notification.create({
      data: {
        userId: goal.ownerId,
        type: 'GOAL_RETURNED',
        title: 'A locked goal was unlocked by Admin',
        message: 'Reason: ' + reason.trim().slice(0, 200),
        link: '/dashboard/goals/new',
      },
    });

    revalidatePath('/dashboard/goals');
    revalidatePath('/dashboard/audit');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unlock failed' };
  }
}