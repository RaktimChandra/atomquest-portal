import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalSheetEditor } from '@/components/goals/goal-sheet-editor';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Sparkles } from 'lucide-react';

export default async function NewGoalSheetPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div>
        <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle. Contact HR.</CardContent></Card>
      </div>
    );
  }

  const [thrustAreas, existingGoals] = await Promise.all([
    prisma.thrustArea.findMany({ where: { cycleId: cycle.id }, orderBy: { name: 'asc' } }),
    prisma.goal.findMany({
      where: { ownerId: session.user.id, cycleId: cycle.id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const draftGoals = existingGoals.filter((g) => g.status === 'DRAFT');
  const approved = existingGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED');
  const submitted = existingGoals.filter((g) => g.status === 'SUBMITTED');

  // If user has approved goals, they cannot edit (would need admin unlock)
  const isLocked = approved.length > 0 && draftGoals.length === 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard/goals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to my goals
          </Link>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
            <Sparkles className="h-3 w-3" /> {cycle.name} · Goal-setting window
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">{draftGoals.length > 0 ? 'Continue goal sheet' : 'Create goal sheet'}</h1>
          <p className="text-muted-foreground text-sm mt-1">Add up to 8 goals across thrust areas. Total weightage must equal 100%.</p>
        </div>
      </div>

      {isLocked && (
        <div className="flex items-start gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
          <Lock className="h-4 w-4 text-indigo-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium">Your goal sheet is locked.</div>
            <div className="text-muted-foreground text-xs mt-0.5">Approved goals cannot be edited. Contact Admin/HR for unlock.</div>
          </div>
        </div>
      )}

      {submitted.length > 0 && draftGoals.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="h-4 w-4 rounded-full bg-amber-400 mt-0.5 animate-pulse" />
          <div className="text-sm">
            <div className="font-medium">Goal sheet is awaiting manager approval.</div>
            <div className="text-muted-foreground text-xs mt-0.5">You'll be notified once your manager reviews it. Re-edit possible if returned for rework.</div>
          </div>
        </div>
      )}

      <GoalSheetEditor
        thrustAreas={thrustAreas}
        existingDraft={draftGoals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          thrustAreaId: g.thrustAreaId,
          uomType: g.uomType,
          uomUnit: g.uomUnit,
          target: g.target,
          targetDate: g.targetDate,
          weightage: g.weightage,
          status: g.status,
        }))}
        isLocked={isLocked}
      />
    </div>
  );
}
