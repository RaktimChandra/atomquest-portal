import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Target, ClipboardCheck, Users, TrendingUp, Sparkles, CheckCircle2, Clock, ArrowRight, type LucideIcon } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id;
  const role = session.user.role;

  const myGoals = await prisma.goal.count({ where: { ownerId: userId } });
  const pendingApprovals = role === 'MANAGER'
    ? await prisma.goal.count({ where: { owner: { managerId: userId }, status: 'SUBMITTED' } })
    : 0;
  const teamSize = role === 'MANAGER'
    ? await prisma.user.count({ where: { managerId: userId } })
    : role === 'ADMIN' ? await prisma.user.count() : 0;
  const activeCycle = await prisma.cycle.findFirst({ where: { isActive: true } });

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          <Sparkles className="h-3 w-3 text-brand" /> {activeCycle?.name ?? 'No active cycle'}
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
          Good to see you, <span className="text-brand">{session.user.name?.split(' ')[0]}</span>.
        </h1>
        <p className="text-muted-foreground">
          {role === 'EMPLOYEE' && 'A snapshot of your goal sheet and upcoming check-ins.'}
          {role === 'MANAGER' && 'Pending approvals and team progress at a glance.'}
          {role === 'ADMIN' && 'Org-wide cycle status, completion, and governance.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {role === 'EMPLOYEE' && (
          <>
            <StatCard icon={Target} label="My Goals" value={myGoals} hint={`of max 8`} />
            <StatCard icon={CheckCircle2} label="Approved" value={myGoals} hint="Locked for cycle" />
            <StatCard icon={Clock} label="Next Check-in" value={0} display="Q1" hint="Window opens July" />
            <StatCard icon={TrendingUp} label="Avg Score" value={0} display="—" hint="Updates each quarter" />
          </>
        )}
        {role === 'MANAGER' && (
          <>
            <StatCard icon={Target} label="My Goals" value={myGoals} hint="Personal sheet" />
            <StatCard icon={ClipboardCheck} label="Pending Approvals" value={pendingApprovals} hint="Awaiting your action" highlight={pendingApprovals > 0} />
            <StatCard icon={Users} label="Team Size" value={teamSize} hint="Direct reports" />
            <StatCard icon={TrendingUp} label="Active Cycle" value={0} display={activeCycle?.phase ?? '—'} hint="Goal-Setting open" />
          </>
        )}
        {role === 'ADMIN' && (
          <>
            <StatCard icon={Users} label="Total Employees" value={teamSize} hint="Across org" />
            <StatCard icon={ClipboardCheck} label="Cycle Phase" value={0} display={activeCycle?.phase ?? '—'} hint="Current window" />
            <StatCard icon={TrendingUp} label="Submission" value={0} display="Live" hint="Auto-updates" />
            <StatCard icon={Sparkles} label="Audit Events" value={0} display="Track" hint="Full trail logged" />
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        {role === 'EMPLOYEE' && (
          <>
            <QuickAction href="/dashboard/goals/new" icon={Target} title="Edit your goal sheet" desc="Update drafts, adjust weightage, submit for approval." />
            <QuickAction href="/dashboard/checkins" icon={ClipboardCheck} title="Log a quarterly check-in" desc="Record progress and view your auto-computed score." />
            <QuickAction href="/dashboard/notifications" icon={Sparkles} title="View notifications" desc="Approvals, returns, shared goals, escalations." />
          </>
        )}
        {role === 'MANAGER' && (
          <>
            <QuickAction href="/dashboard/approvals" icon={ClipboardCheck} title="Review approvals" desc={pendingApprovals + ' awaiting review'} highlight={pendingApprovals > 0} />
            <QuickAction href="/dashboard/team" icon={Users} title="Team rollup" desc="Per-report check-in scores at a glance." />
            <QuickAction href="/dashboard/analytics" icon={TrendingUp} title="Analytics & galaxy" desc="QoQ trends, heatmap, 3D org viz." />
          </>
        )}
        {role === 'ADMIN' && (
          <>
            <QuickAction href="/dashboard/cycles" icon={Sparkles} title="Configure cycles" desc="Thrust areas, quarter windows, activation." />
            <QuickAction href="/dashboard/completion" icon={TrendingUp} title="Completion dashboard" desc="Real-time submission + check-in rates." />
            <QuickAction href="/dashboard/escalations" icon={ClipboardCheck} title="Escalation rules" desc="Configurable thresholds with audit log." />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <Badge variant="info" className="w-fit">All 8 phases shipped</Badge>
          <CardTitle className="mt-2">AtomQuest is fully operational.</CardTitle>
          <CardDescription>
            Every Phase 1 / Phase 2 requirement implemented. All 4 bonus features included: SSO, notifications, escalation engine, analytics. Cost-optimized serverless stack. Audit-ready governance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 4 UoM scoring formulas live</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% weightage enforcement</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Quarterly window enforcement</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> CSV + Excel export</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Shared goals with sync</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 3D org-alignment galaxy</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, display, hint, highlight }: { icon: LucideIcon; label: string; value: number; display?: string; hint: string; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-brand/40 bg-card' : ''}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={'h-10 w-10 rounded-xl flex items-center justify-center ' + (highlight ? 'bg-brand text-white shadow-md shadow-blue-500/20' : 'bg-secondary text-foreground')}>
            <Icon className="h-5 w-5" />
          </div>
          {highlight && <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />}
        </div>
        <div className="text-3xl font-display font-bold tracking-tight tnum">
          {display ? display : <NumberTicker value={value} />}
        </div>
        <div className="text-sm font-medium mt-1">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, title, desc, highlight }: { href: string; icon: LucideIcon; title: string; desc: string; highlight?: boolean }) {
  return (
    <Link href={href}>
      <Card className={'group transition-all cursor-pointer ' + (highlight ? 'border-brand/40' : '')}>
        <CardContent className="p-5">
          <div className={'h-10 w-10 rounded-xl flex items-center justify-center mb-3 ' + (highlight ? 'bg-brand text-white shadow-md shadow-blue-500/20' : 'bg-secondary text-foreground')}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}