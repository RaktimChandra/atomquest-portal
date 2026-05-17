'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  BarChart3,
  TrendingUp,
  Users,
  Settings,
  FileText,
  Bell,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SessionUser = { role: string; name?: string | null; email?: string | null };

type NavItem = { label: string; href: string; icon: LucideIcon };

const navByRole: Record<string, NavItem[]> = {
  EMPLOYEE: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Goals', href: '/dashboard/goals', icon: Target },
    { label: 'Check-ins', href: '/dashboard/checkins', icon: ClipboardCheck },
    { label: 'Audit Log', href: '/dashboard/audit', icon: FileText },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ],
  MANAGER: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Goals', href: '/dashboard/goals', icon: Target },
    { label: 'Team', href: '/dashboard/team', icon: Users },
    { label: 'Approvals', href: '/dashboard/approvals', icon: ClipboardCheck },
    { label: 'Completion', href: '/dashboard/completion', icon: BarChart3 },
    { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { label: 'Audit Log', href: '/dashboard/audit', icon: FileText },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ],
  ADMIN: [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Cycles', href: '/dashboard/cycles', icon: Settings },
    { label: 'Org', href: '/dashboard/org', icon: Users },
    { label: 'Completion', href: '/dashboard/completion', icon: BarChart3 },
    { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { label: 'Audit Log', href: '/dashboard/audit', icon: FileText },
    { label: 'Escalations', href: '/dashboard/escalations', icon: Bell },
  ],
};

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const nav = navByRole[user.role] ?? navByRole.EMPLOYEE;

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/40 bg-card/30 backdrop-blur-xl">
      <div className="p-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-atom-400 to-atom-600 blur-md opacity-60" />
            <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-atom-500 to-atom-700 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white">
                <circle cx="12" cy="12" r="2" fill="currentColor" />
                <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
                <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-display text-base font-bold leading-none">AtomQuest</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Goal Portal</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-atom-500/15 to-atom-500/5 border border-atom-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <ItemIcon className={cn('relative h-4 w-4', active && 'text-atom-400')} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/40">
        <div className="card-3d p-3 bg-gradient-to-br from-atom-500/10 to-purple-500/5">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-atom-400" />
            <span className="font-semibold">Cycle Active</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Goal-Setting window is open. Submit before window close.</p>
        </div>
      </div>
    </aside>
  );
}