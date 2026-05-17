import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Sparkles } from 'lucide-react';
import { aggregateScore } from '@/lib/score-engine';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;

  // Scope: ADMIN sees everyone, MANAGER sees their reports
  const userFilter = session.user.role === 'ADMIN'
    ? { role: { in: ['EMPLOYEE', 'MANAGER'] as ('EMPLOYEE' | 'MANAGER')[] } }
    : { managerId: session.user.id };

  const users = await prisma.user.findMany({
    where: userFilter,
    include: {
      manager: { select: { id: true, name: true } },
      ownedGoals: {
        where: { cycleId: cycle.id },
        include: { thrustArea: true, checkIns: true },
      },
    },
  });

  // Build all the analytics aggregates
  const thrustDistribution: Record<string, { name: string; color: string; count: number; totalWeight: number }> = {};
  const uomDistribution: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {};
  const qoqTrend: Record<string, { quarter: string; avgScore: number; checkInsCount: number; scores: number[] }> = {
    Q1: { quarter: 'Q1', avgScore: 0, checkInsCount: 0, scores: [] },
    Q2: { quarter: 'Q2', avgScore: 0, checkInsCount: 0, scores: [] },
    Q3: { quarter: 'Q3', avgScore: 0, checkInsCount: 0, scores: [] },
    Q4: { quarter: 'Q4', avgScore: 0, checkInsCount: 0, scores: [] },
  };

  const allGoals = users.flatMap((u) => u.ownedGoals);

  for (const g of allGoals) {
    // Thrust area
    const tk = g.thrustAreaId;
    if (!thrustDistribution[tk]) thrustDistribution[tk] = { name: g.thrustArea.name, color: g.thrustArea.color, count: 0, totalWeight: 0 };
    thrustDistribution[tk].count++;
    thrustDistribution[tk].totalWeight += g.weightage;

    // UoM
    uomDistribution[g.uomType] = (uomDistribution[g.uomType] ?? 0) + 1;
    // Status
    statusDistribution[g.status] = (statusDistribution[g.status] ?? 0) + 1;

    // QoQ
    for (const ci of g.checkIns) {
      const bucket = qoqTrend[ci.quarter];
      if (bucket && ci.computedScore !== null && ci.computedScore !== undefined) {
        bucket.scores.push(ci.computedScore);
        bucket.checkInsCount++;
      }
    }
  }

  for (const q of Object.values(qoqTrend)) {
    q.avgScore = q.scores.length === 0 ? 0 : q.scores.reduce((s, n) => s + n, 0) / q.scores.length;
  }

  // Heatmap: department x quarter completion %
  const departments = Array.from(new Set(users.map((u) => u.department ?? 'Unassigned')));
  const heatmap: { department: string; q1: number; q2: number; q3: number; q4: number }[] = departments.map((dept) => {
    const usersInDept = users.filter((u) => (u.department ?? 'Unassigned') === dept);
    const totalApprovedGoals = usersInDept.reduce((s, u) => s + u.ownedGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED').length, 0);
    const pct = (q: string) => {
      if (totalApprovedGoals === 0) return 0;
      const checkIns = usersInDept.reduce((s, u) => s + u.ownedGoals.filter((g) => (g.status === 'APPROVED' || g.status === 'LOCKED') && g.checkIns.some((c) => c.quarter === q)).length, 0);
      return Math.round((checkIns / totalApprovedGoals) * 100);
    };
    return { department: dept, q1: pct('Q1'), q2: pct('Q2'), q3: pct('Q3'), q4: pct('Q4') };
  });

  // Manager effectiveness: % of their reports' check-ins completed in current quarter
  const managerIds = Array.from(new Set(users.map((u) => u.manager?.id).filter(Boolean) as string[]));
  const managers = await prisma.user.findMany({ where: { id: { in: managerIds } }, select: { id: true, name: true, department: true } });

  const managerEffectiveness = managers.map((m) => {
    const reports = users.filter((u) => u.manager?.id === m.id);
    const approvedGoals = reports.flatMap((r) => r.ownedGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED'));
    const totalCheckInsExpected = approvedGoals.length * 4; // 4 quarters
    const totalCheckInsDone = approvedGoals.reduce((s, g) => s + g.checkIns.length, 0);
    const avgScore = aggregateScore(approvedGoals.flatMap((g) => g.checkIns.map((c) => ({ weightage: g.weightage, score: c.computedScore ?? 0 }))));
    return {
      managerId: m.id,
      managerName: m.name,
      department: m.department ?? 'Unassigned',
      reportCount: reports.length,
      checkInRate: totalCheckInsExpected === 0 ? 0 : Math.round((totalCheckInsDone / totalCheckInsExpected) * 100),
      avgScore: Math.round(avgScore),
    };
  }).sort((a, b) => b.checkInRate - a.checkInRate);

  // 3D galaxy data — only for ADMIN, scoped down for MANAGER
  const galaxyUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    department: u.department ?? 'Unassigned',
    managerId: u.manager?.id ?? null,
    goalCount: u.ownedGoals.length,
    approvedCount: u.ownedGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED').length,
    avgScore: Math.round(aggregateScore(u.ownedGoals.flatMap((g) => g.checkIns.map((c) => ({ weightage: g.weightage, score: c.computedScore ?? 0 }))))),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {cycle.name}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-atom-400" /> Analytics
        </h1>
        <p className="text-muted-foreground text-sm">QoQ trends, distribution insights, manager effectiveness, and the org-goal alignment galaxy.</p>
      </div>

      <AnalyticsDashboard
        thrustDistribution={Object.values(thrustDistribution)}
        uomDistribution={uomDistribution}
        statusDistribution={statusDistribution}
        qoqTrend={Object.values(qoqTrend).map((q) => ({ quarter: q.quarter, avgScore: Math.round(q.avgScore), checkInsCount: q.checkInsCount }))}
        heatmap={heatmap}
        managerEffectiveness={managerEffectiveness}
        galaxyUsers={galaxyUsers}
        totalGoals={allGoals.length}
        totalUsers={users.length}
      />
    </div>
  );
}