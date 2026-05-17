import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ unread: 0, items: [] }, { status: 401 });

  const [unread, items] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),
  ]);
  return NextResponse.json({ unread, items });
}