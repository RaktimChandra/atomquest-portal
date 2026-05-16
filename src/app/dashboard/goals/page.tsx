import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Target, CheckCircle2, Clock, FileText, Lock, AlertCircle, ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';
import { cn, STATUS_COLORS, UOM_LABELS, formatDate } from '@/lib/utils';

export default async function GoalsListPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">My Goals</h1>
        <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle. Contact HR.</CardContent></Card>
      </div>
    );
  }

  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id, cycleId: cycle.id },
    include: { thrustArea: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
  });

  const drafts = goals.filter((g) => g.status === 'DRAFT');
  const submitted = goals.filter((g) => g.status === 'SUBMITTED');
  const returned = goals.filter((g) => g.status === 'RETURNED');
  const approved = goals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED');

  const isLocked = approved.length > 0 && drafts.length === 0 && submitted.length === 0;
  const draftTotal = drafts.reduce((s, g) => s + g.weightage, 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
            <Sparkles className="h-3 w-3" /> {cycle.name}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">My Goals</h1>
          <p className="text-muted-foreground text-sm">Your goal sheet for the active cycle. Total: {goals.length} goal{goals.length !== 1 ? 's' : ''}.</p>
        </div>
        {!isLocked && (
          <Link href="/dashboard/goals/new">
            <Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" /> {goals.length === 0 ? 'Create goal sheet' : 'Edit sheet'}</Button>
          </Link>
        )}
      </div>

      {/* Top status row */}
      <div className="grid sm:grid-cols-4 gap-3">
        <StatusCounter icon={FileText} label="Draft" count={drafts.length} hint={drafts.length > 0 ? `${draftTotal}% allocated` : 'Not started'} tone="text-slate-400" />
        <StatusCounter icon={Clock} label="Submitted" count={submitted.length} hint="Awaiting approval" tone="text-amber-400" />
        <StatusCounter icon={AlertCircle} label="Returned" count={returned.length} hint="Need rework" tone="text-rose-400" />
        <StatusCounter icon={Lock} label="Approved" count={approved.length} hint={approved.length > 0 ? 'Locked for cycle' : 'Pending'} tone="text-emerald-400" />
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-atom-500/10 mx-auto flex items-center justify-center mb-4">
              <Target className="h-8 w-8 text-atom-400" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-1.5">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">Goal-setting window is open. Add up to 8 goals across thrust areas — total weightage must equal 100%.</p>
            <Link href="/dashboard/goals/new">
              <Button variant="gradient" className="gap-2"><Plus className="h-4 w-4" /> Create goal sheet</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Section: Drafts / In-progress */}
      {(drafts.length > 0 || submitted.length > 0 || returned.length > 0) && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">In progress</div>
          {[...drafts, ...returned, ...submitted].map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </div>
      )}

      {/* Section: Approved */}
      {approved.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
            <Lock className="h-3 w-3" /> Approved & locked
          </div>
          {approved.map((g) => (
            <GoalRow key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusCounter({ icon: Icon, label, count, hint, tone }: { icon: LucideIcon; label: string; count: number; hint: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center bg-foreground/5', tone)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold">{count}</span>
            <span className="text-[11px] text-muted-foreground">{hint}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalRow({ goal }: { goal: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>
          <Target className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{goal.title}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
            <Badge variant="outline" className="border-none" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>{goal.thrustArea.name}</Badge>
            <span>{UOM_LABELS[goal.uomType]}</span>
            {goal.targetDate && <span>· by {formatDate(goal.targetDate)}</span>}
            {goal.target !== null && <span>· target {goal.target}{goal.uomUnit ? ' ' + goal.uomUnit : ''}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-display text-xl font-bold tracking-tight">{goal.weightage}<span className="text-sm text-muted-foreground">%</span></div>
        </div>
        <Badge className={cn('border', STATUS_COLORS[goal.status])} variant="outline">{goal.status}</Badge>
      </CardContent>
    </Card>
  );
}
