'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Inbox, Trash2, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markNotificationRead, deleteNotification, markAllRead } from '@/lib/actions/notifications';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const typeConfig: Record<string, { tone: string; label: string }> = {
  GOAL_SUBMITTED:   { tone: 'text-amber-400',   label: 'Goal submitted' },
  GOAL_APPROVED:    { tone: 'text-emerald-400', label: 'Goal approved' },
  GOAL_RETURNED:    { tone: 'text-rose-400',    label: 'Goal returned' },
  CHECKIN_REMINDER: { tone: 'text-blue-400',    label: 'Check-in reminder' },
  ESCALATION:       { tone: 'text-rose-400',    label: 'Escalation' },
  SHARED_GOAL:      { tone: 'text-cyan-400',    label: 'Shared goal' },
  CYCLE_OPENED:     { tone: 'text-atom-400',    label: 'Cycle opened' },
};

export function NotificationsList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? items.filter((i) => !i.isRead) : items;
  const unreadCount = items.filter((i) => !i.isRead).length;

  async function handleRead(id: string) {
    const r = await markNotificationRead(id);
    if (r.ok) setItems(items.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
  }

  async function handleDelete(id: string) {
    const r = await deleteNotification(id);
    if (r.ok) {
      setItems(items.filter((i) => i.id !== id));
      toast.success('Deleted');
    } else toast.error(r.error);
  }

  async function handleAllRead() {
    const r = await markAllRead();
    if (r.ok) {
      setItems(items.map((i) => ({ ...i, isRead: true })));
      toast.success('All marked read');
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFilter('all')} className={cn('text-xs uppercase tracking-wide px-3 py-1.5 rounded-full font-semibold transition-colors', filter === 'all' ? 'bg-atom-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>All · {items.length}</button>
            <button onClick={() => setFilter('unread')} className={cn('text-xs uppercase tracking-wide px-3 py-1.5 rounded-full font-semibold transition-colors', filter === 'unread' ? 'bg-atom-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>Unread · {unreadCount}</button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleAllRead} className="gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-display text-lg font-semibold mb-1">All caught up</h3>
            <p className="text-sm text-muted-foreground">{filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}</p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {filtered.map((n) => {
              const cfg = typeConfig[n.type] ?? { tone: 'text-muted-foreground', label: n.type };
              return (
                <motion.div key={n.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }}>
                  <Card className={cn(!n.isRead && 'border-atom-500/30 bg-atom-500/[0.03]')}>
                    <CardContent className="p-4 flex items-start gap-3">
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-atom-400 mt-2 flex-shrink-0" />}
                      {n.isRead && <span className="h-2 w-2 mt-2 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge variant="outline" className={cn('text-[10px] py-0', cfg.tone)}>{cfg.label}</Badge>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div className={cn('text-sm leading-tight', !n.isRead && 'font-semibold')}>{n.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                        {n.link && (
                          <a href={n.link} onClick={() => handleRead(n.id)} className="inline-flex items-center gap-1 text-xs text-atom-400 hover:text-atom-300 mt-1.5">
                            Open <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {!n.isRead && (
                          <Button variant="ghost" size="icon" onClick={() => handleRead(n.id)} title="Mark as read" className="h-7 w-7">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} title="Delete" className="h-7 w-7 text-rose-400 hover:text-rose-300">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}