import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CheckInForm } from '@/components/checkins/checkin-form';
import { ScoreGauge } from '@/components/checkins/score-gauge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lock, ClipboardCheck, Calendar } from 'lucide-react';
import { aggregateScore, currentQuarter, QUARTER_LABELS } from '@/lib/score-engine';

export default async function CheckInsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const { q } = await searchParams;

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Check-ins</h1>
        <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>
      </div>
    );
  }

  // Pick the quarter — current (if any), or the user's selection from query string, or Q1 as default
  const cq = currentQuarter();
  const allowedQuarters: ('Q1' | 'Q2' | 'Q3' | 'Q4')[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const selectedQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = (q && allowedQuarters.includes(q as any) ? q : cq ?? 'Q1') as any;

  const approvedGoals = await prisma.goal.findMany({
    where: {
      ownerId: session.user.id,
      cycleId: cycle.id,
      status: { in: ['APPROVED', 'LOCKED'] },
    },
    include: {
      thrustArea: true,
      checkIns: {
        where: { quarter: selectedQuarter },
        include: { managerCheckIn: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const goalsForForm = approvedGoals.map((g) => {
    const ci = g.checkIns[0];
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      thrustArea: { name: g.thrustArea.name, color: g.thrustArea.color },
      uomType: g.uomType,
      uomUnit: g.uomUnit,
      target: g.target,
      targetDate: g.targetDate?.toISOString() ?? null,
      weightage: g.weightage,
      checkIn: ci
        ? {
            id: ci.id,
            actualValue: ci.actualValue,
            actualDate: ci.actualDate?.toISOString() ?? null,
            status: ci.status,
            selfComment: ci.selfComment,
            computedScore: ci.computedScore,
            managerComment: ci.managerCheckIn?.comment ?? null,
          }
        : null,
    };
  });

  // Aggregate score across goals where check-in exists
  const aggScore = aggregateScore(
    goalsForForm
      .filter((g) => g.checkIn && g.checkIn.computedScore !== null)
      .map((g) => ({ weightage: g.weightage, score: g.checkIn!.computedScore ?? 0 }))
  );

  const completed = goalsForForm.filter((g) => g.checkIn).length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {cycle.name} · Check-in
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">Quarterly Check-ins</h1>
        <p className="text-muted-foreground text-sm">Log actual achievement vs. planned target. Scores auto-compute by UoM formula.</p>
      </div>

      {/* Quarter switcher */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {allowedQuarters.map((q) => {
              const cfg = QUARTER_LABELS[q];
              const isActive = q === selectedQuarter;
              const isCurrent = q === cq;
              return (
                <Link key={q} href={'/dashboard/checkins?q=' + q} className="block">
                  <div className={'rounded-lg p-3 text-center transition-all border ' + (isActive ? 'bg-atom-500/15 border-atom-500/40 shadow-glow-sm' : 'bg-muted/30 border-border/40 hover:bg-muted/50')}>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                      <Calendar className="h-3 w-3" />
                      {cfg.label}
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

      {goalsForForm.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-xl font-semibold mb-1.5">No approved goals yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">Check-ins unlock once your goals are approved by your manager. Submit your goal sheet from the My Goals page.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Aggregate snapshot */}
          <Card>
            <CardContent className="p-6 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
              <ScoreGauge score={aggScore} size={120} strokeWidth={10} />
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{QUARTER_LABELS[selectedQuarter].label} aggregate</div>
                <div className="font-display text-2xl font-bold tracking-tight">{Math.round(aggScore)}<span className="text-base text-muted-foreground">/100</span></div>
                <div className="text-xs text-muted-foreground">{completed} of {goalsForForm.length} goals checked in · weighted by goal % allocation</div>
              </div>
            </CardContent>
          </Card>

          <CheckInForm quarter={selectedQuarter} quarterLabel={QUARTER_LABELS[selectedQuarter].label} goals={goalsForForm} />
        </>
      )}
    </div>
  );
}