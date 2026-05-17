'use client';

import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { initials, ROLE_LABELS } from '@/lib/utils';

type SessionUser = { name?: string | null; email?: string | null; role: string; designation?: string | null };

export function Topbar({ user }: { user: SessionUser }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search goals, people…"
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/40 transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 border border-border/60 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationBell />

          {/* Animated theme toggle */}
          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </motion.div>
            </AnimatePresence>
          </Button>

          <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border/60">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{ROLE_LABELS[user.role] ?? user.role}{user.designation ? ' · ' + user.designation : ''}</div>
            </div>
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-blue-500/20">
                {initials(user.name ?? 'U')}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}