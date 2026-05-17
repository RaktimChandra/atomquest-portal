'use client';

import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { initials, ROLE_LABELS } from '@/lib/utils';

type SessionUser = { name?: string | null; email?: string | null; role: string; designation?: string | null };

export function Topbar({ user }: { user: SessionUser }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search goals, people…"
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-border/60 bg-background/40 backdrop-blur text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border/40">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">{user.name}</div>
              <div className="text-[11px] text-muted-foreground leading-tight">{ROLE_LABELS[user.role] ?? user.role}{user.designation ? ' · ' + user.designation : ''}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-glow-sm">
              {initials(user.name ?? 'U')}
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