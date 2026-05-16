import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/checkins/score-gauge';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { initials } from '@/lib/utils';
import { aggregateScore, currentQuarter, QUARTER_LABELS } from '@/lib/score-engine';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;

  const cq = currentQuarter() ?? 'Q1';

  const reports = await prisma.user.findMany({
    where: session.user.role === 'ADMIN' ? {} : { managerId: session.user.id },
    include: {
      ownedGoals: {
        where: { cycleId: cycle.id, status: { in: ['APPROVED', 'LOCKED'] } },
        include: { checkIns: { where: { quarter: cq } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const teamData = reports
    .filter((r) => r.id !== session.user.id)
    .map((r) => {
      const goalsWithScore = r.ownedGoals.map((g) => ({
        weightage: g.weightage,
        score: g.checkIns[0]?.computedScore ?? 0,
        hasCheckIn: !!g.checkIns[0],
      }));
      const agg = aggregateScore(goalsWithScore.filter((g) => g.hasCheckIn));
      const completed = goalsWithScore.filter((g) => g.hasCheckIn).length;
      return {
        id: r.id,
        name: r.name,
        designation: r.designation,
        department: r.department,
        totalGoals: goalsWithScore.length,
        completedCheckIns: completed,
        aggScore: agg,
      };
    });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {cycle.name} · {QUARTER_LABELS[cq].label}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">My Team</h1>
        <p className="text-muted-foreground text-sm">Roll-up of your direct reports' approved goals and current-quarter check-ins.</p>
      </div>

      {teamData.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-xl font-semibold mb-1.5">No direct reports</h3>
            <p className="text-sm text-muted-foreground">You have no team members assigned in the org hierarchy yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamData.map((r) => (
            <Link key={r.id} href={'/dashboard/team/' + r.id}>
              <Card className="hover:border-atom-500/40 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {initials(r.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.designation ?? ''} {r.department ? '· ' + r.department : ''}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{r.totalGoals} approved goal{r.totalGoals !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{r.completedCheckIns}/{r.totalGoals} {QUARTER_LABELS[cq].label.split(' ')[0]} check-ins done</span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <ScoreGauge score={r.aggScore} size={70} strokeWidth={7} showLabel={false} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}