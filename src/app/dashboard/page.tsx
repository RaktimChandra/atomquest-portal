import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, ClipboardCheck, Users, TrendingUp, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const userId = session.user.id;
  const role = session.user.role;

  // Quick stats by role
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
      {/* Greeting */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {activeCycle?.name ?? 'No active cycle'}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Good to see you, <span className="text-gradient-brand">{session.user.name?.split(' ')[0]}</span>.
        </h1>
        <p className="text-muted-foreground">
          {role === 'EMPLOYEE' && 'Here is a snapshot of your goal sheet and upcoming check-ins.'}
          {role === 'MANAGER' && 'Pending approvals and team progress at a glance.'}
          {role === 'ADMIN' && 'Org-wide cycle status, completion, and governance.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target} label={role === 'ADMIN' ? 'Total Employees' : 'My Goals'} value={role === 'ADMIN' ? teamSize : myGoals} hint={role === 'ADMIN' ? 'Across org' : `of max 8`} color="from-atom-500 to-indigo-600" />
        {role === 'MANAGER' && (
          <>
            <StatCard icon={ClipboardCheck} label="Pending Approvals" value={pendingApprovals} hint="Awaiting your action" color="from-amber-500 to-orange-600" />
            <StatCard icon={Users} label="Team" value={teamSize} hint="Direct reports" color="from-emerald-500 to-teal-600" />
            <StatCard icon={TrendingUp} label="Active Cycle" value="—" hint="Goal-Setting open" color="from-purple-500 to-pink-600" />
          </>
        )}
        {role === 'EMPLOYEE' && (
          <>
            <StatCard icon={CheckCircle2} label="Approved" value={myGoals} hint="Locked for the year" color="from-emerald-500 to-teal-600" />
            <StatCard icon={Clock} label="Next Check-in" value="Q1" hint="Window opens July" color="from-amber-500 to-orange-600" />
            <StatCard icon={TrendingUp} label="Avg Score" value="—" hint="Updates each quarter" color="from-purple-500 to-pink-600" />
          </>
        )}
        {role === 'ADMIN' && (
          <>
            <StatCard icon={ClipboardCheck} label="Cycle Phase" value={activeCycle?.phase ?? '—'} hint="Current window" color="from-amber-500 to-orange-600" />
            <StatCard icon={TrendingUp} label="Submission Rate" value="—" hint="Updates live" color="from-emerald-500 to-teal-600" />
            <StatCard icon={Sparkles} label="Audit Events" value="—" hint="Logged today" color="from-purple-500 to-pink-600" />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <Badge variant="info" className="w-fit">Phase 0 · Foundation deployed</Badge>
          <CardTitle className="mt-2">Welcome to AtomQuest.</CardTitle>
          <CardDescription>
            Your portal foundation is live — authentication, role-based access, database, and the design system are wired up.
            Rich goal-creation, approval, check-in, analytics and admin flows are being rolled out in subsequent phases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Authentication: NextAuth v5 + bcrypt + JWT sessions</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Database: Postgres (Neon) + Prisma 6 — full schema migrated</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Role-based middleware enforced on every protected route</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Premium design system with 3D depth, glassmorphism, motion</div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; hint: string; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${color} opacity-15 blur-2xl`} />
      <CardContent className="p-6 relative">
        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-glow-sm mb-4`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-3xl font-bold font-display tracking-tight">{value}</div>
        <div className="text-sm font-medium mt-1">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
      </CardContent>
    </Card>
  );
}
