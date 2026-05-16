import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { ManagerCheckInView } from '@/components/checkins/manager-checkin';
import { ScoreGauge } from '@/components/checkins/score-gauge';
import { ArrowLeft, Sparkles, Calendar } from 'lucide-react';
import { aggregateScore, currentQuarter, QUARTER_LABELS } from '@/lib/score-engine';

export default async function TeamMemberPage({ params, searchParams }: { params: Promise<{ employeeId: string }>; searchParams: Promise<{ q?: string }> }) {
  const { employeeId } = await params;
  const { q } = await searchParams;

  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, name: true, email: true, designation: true, department: true, managerId: true },
  });
  if (!employee) notFound();
  if (employee.managerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard/team');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;

  const cq = currentQuarter();
  const allowed: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const selectedQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = (q && allowed.includes(q as any) ? q : cq ?? 'Q1') as any;

  const goals = await prisma.goal.findMany({
    where: { ownerId: employeeId, cycleId: cycle.id, status: { in: ['APPROVED', 'LOCKED'] } },
    include: {
      thrustArea: true,
      checkIns: { include: { managerCheckIn: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const goalsForView = goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    thrustArea: { name: g.thrustArea.name, color: g.thrustArea.color },
    uomType: g.uomType,
    uomUnit: g.uomUnit,
    target: g.target,
    targetDate: g.targetDate?.toISOString() ?? null,
    weightage: g.weightage,
    checkIns: g.checkIns.map((c) => ({
      id: c.id,
      quarter: c.quarter,
      actualValue: c.actualValue,
      actualDate: c.actualDate?.toISOString() ?? null,
      status: c.status,
      computedScore: c.computedScore,
      selfComment: c.selfComment,
      managerComment: c.managerCheckIn?.comment ?? null,
      managerRating: c.managerCheckIn?.rating ?? null,
    })),
  }));

  const quarterGoals = goalsForView.map((g) => ({
    weightage: g.weightage,
    score: g.checkIns.find((c) => c.quarter === selectedQuarter)?.computedScore ?? 0,
    hasCheckIn: !!g.checkIns.find((c) => c.quarter === selectedQuarter),
  }));
  const agg = aggregateScore(quarterGoals.filter((g) => g.hasCheckIn));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Link href="/dashboard/team" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to team
        </Link>
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
          <Sparkles className="h-3 w-3" /> {cycle.name}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">{employee.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{employee.designation ?? ''} {employee.department ? '· ' + employee.department : ''} · {employee.email}</p>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {allowed.map((q) => {
              const cfg = QUARTER_LABELS[q];
              const isActive = q === selectedQuarter;
              const isCurrent = q === cq;
              return (
                <Link key={q} href={'/dashboard/team/' + employee.id + '?q=' + q}>
                  <div className={'rounded-lg p-3 text-center transition-all border ' + (isActive ? 'bg-atom-500/15 border-atom-500/40 shadow-glow-sm' : 'bg-muted/30 border-border/40 hover:bg-muted/50')}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                      <Calendar className="h-3 w-3" />{cfg.label}
                      {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{cfg.window}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
          <ScoreGauge score={agg} size={120} strokeWidth={10} />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{QUARTER_LABELS[selectedQuarter].label} aggregate</div>
            <div className="font-display text-2xl font-bold tracking-tight">{Math.round(agg)}<span className="text-base text-muted-foreground">/100</span></div>
            <div className="text-xs text-muted-foreground">{quarterGoals.filter((g) => g.hasCheckIn).length} of {goalsForView.length} goals checked in</div>
          </div>
        </CardContent>
      </Card>

      {goalsForView.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p className="text-sm">No approved goals for this cycle yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ManagerCheckInView employeeName={employee.name} quarter={selectedQuarter} goals={goalsForView} />
      )}
    </div>
  );
}