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
import { Logo } from '@/components/ui/logo';

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
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="p-5 border-b border-border/60">
        <Logo size={32} animated href="/dashboard" />
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-lg bg-accent/80 border border-border/60"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <ItemIcon className={cn('relative h-4 w-4 transition-colors', active && 'text-foreground')} />
              <span className="relative">{item.label}</span>
              {active && <motion.span layoutId="active-dot" className="relative ml-auto h-1.5 w-1.5 rounded-full bg-brand" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border/60">
        <div className="rounded-lg border border-border/60 bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="font-semibold">Cycle Active</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Goal-Setting window is open. Submit before close.</p>
        </div>
      </div>
    </aside>
  );
}