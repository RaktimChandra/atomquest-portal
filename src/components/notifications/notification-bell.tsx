'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markAllRead, markNotificationRead } from '@/lib/actions/notifications';
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

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ unread: number; items: Notification[] }>({ unread: 0, items: [] });
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch {}
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleItemClick(n: Notification) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      refresh();
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function handleAllRead() {
    await markAllRead();
    refresh();
  }

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-4 w-4" />
        {data.unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Notifications</div>
                <div className="text-[11px] text-muted-foreground">{data.unread} unread of {data.items.length} recent</div>
              </div>
              {data.unread > 0 && (
                <button onClick={handleAllRead} className="text-[11px] text-atom-400 hover:text-atom-300 inline-flex items-center gap-1">
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {data.items.length === 0 ? (
                <div className="p-10 text-center">
                  <Inbox className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <div className="text-sm text-muted-foreground">No notifications</div>
                </div>
              ) : (
                data.items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={cn('w-full text-left px-4 py-3 border-b border-border/20 last:border-b-0 hover:bg-accent/30 transition-colors flex items-start gap-3',
                      !n.isRead && 'bg-atom-500/5')}
                  >
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-atom-400 mt-1.5 flex-shrink-0" />}
                    {n.isRead && <span className="h-2 w-2 mt-1.5 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className={cn('text-sm leading-tight', !n.isRead && 'font-semibold')}>{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="px-3 py-2 border-t border-border/40">
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="block text-center text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}