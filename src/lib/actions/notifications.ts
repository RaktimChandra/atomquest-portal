'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Unauthenticated' };

    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== session.user.id) return { ok: false, error: 'Not found' };

    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    revalidatePath('/dashboard/notifications');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function markAllRead(): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Unauthenticated' };

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath('/dashboard/notifications');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false, error: 'Unauthenticated' };
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== session.user.id) return { ok: false, error: 'Not found' };
    await prisma.notification.delete({ where: { id } });
    revalidatePath('/dashboard/notifications');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Failed' };
  }
}