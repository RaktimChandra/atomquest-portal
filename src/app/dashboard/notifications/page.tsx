import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationsList } from '@/components/notifications/notifications-list';
import { Bell, Sparkles } from 'lucide-react';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> Activity
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <Bell className="h-8 w-8 text-atom-400" /> Notifications
        </h1>
        <p className="text-muted-foreground text-sm">Stay on top of approvals, returns, check-in reminders, escalations, and shared goals.</p>
      </div>

      <NotificationsList
        initial={items.map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          message: i.message,
          link: i.link,
          isRead: i.isRead,
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}