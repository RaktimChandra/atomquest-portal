import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CompletionDashboard } from '@/components/admin/completion-dashboard';
import { ExportCard } from '@/components/admin/export-card';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Sparkles } from 'lucide-react';
import { currentQuarter } from '@/lib/score-engine';

export default async function CompletionPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') redirect('/dashboard');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;
  }

  const cq = currentQuarter() ?? 'Q1';

  // For admin: all users. For manager: their reports + themselves.
  const userFilter = session.user.role === 'ADMIN'
    ? { role: { in: ['EMPLOYEE', 'MANAGER'] as ('EMPLOYEE' | 'MANAGER')[] } }
    : { OR: [{ id: session.user.id }, { managerId: session.user.id }] };

  const users = await prisma.user.findMany({
    where: userFilter,
    include: {
      ownedGoals: {
        where: { cycleId: cycle.id },
        include: { checkIns: { where: { quarter: cq } } },
      },
    },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
  });

  // Aggregate by department
  const byDept: Record<string, {
    department: string;
    totalUsers: number;
    submittedSheets: number;
    approvedSheets: number;
    qCheckInsDone: number;
  }> = {};

  for (const u of users) {
    const dept = u.department ?? 'Unassigned';
    if (!byDept[dept]) byDept[dept] = { department: dept, totalUsers: 0, submittedSheets: 0, approvedSheets: 0, qCheckInsDone: 0 };
    byDept[dept].totalUsers++;
    const hasSubmitted = u.ownedGoals.some((g) => g.status === 'SUBMITTED' || g.status === 'APPROVED' || g.status === 'LOCKED');
    const allApproved = u.ownedGoals.length > 0 && u.ownedGoals.every((g) => g.status === 'APPROVED' || g.status === 'LOCKED');
    if (hasSubmitted) byDept[dept].submittedSheets++;
    if (allApproved) byDept[dept].approvedSheets++;
    const approvedCount = u.ownedGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED').length;
    const checkInsForQ = u.ownedGoals.filter((g) => g.checkIns.length > 0).length;
    if (approvedCount > 0 && checkInsForQ === approvedCount) byDept[dept].qCheckInsDone++;
  }

  const deptData = Object.values(byDept).sort((a, b) => a.department.localeCompare(b.department));

  const totals = {
    users: users.length,
    submittedSheets: deptData.reduce((s, d) => s + d.submittedSheets, 0),
    approvedSheets: deptData.reduce((s, d) => s + d.approvedSheets, 0),
    qCheckIns: deptData.reduce((s, d) => s + d.qCheckInsDone, 0),
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {cycle.name} · {cq}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-atom-400" /> Completion Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">Real-time view of submission, approval, and check-in completion rates across {session.user.role === 'ADMIN' ? 'the org' : 'your team'}.</p>
      </div>

      <CompletionDashboard deptData={deptData} totals={totals} quarter={cq} />
      <ExportCard />
    </div>
  );
}