import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShareGoalForm } from '@/components/shared/share-goal-form';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Share2 } from 'lucide-react';

export default async function ShareGoalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;
  }

  const [thrustAreas, candidates] = await Promise.all([
    prisma.thrustArea.findMany({ where: { cycleId: cycle.id }, orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      where: session.user.role === 'ADMIN'
        ? { role: { in: ['EMPLOYEE', 'MANAGER'] } }
        : { managerId: session.user.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, designation: true, department: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/dashboard/team" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
          <Sparkles className="h-3 w-3" /> {cycle.name}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <Share2 className="h-8 w-8 text-atom-400" /> Share a goal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Push a single KPI to multiple team members. Goal title and target are read-only for recipients; they can adjust weightage only.</p>
      </div>

      <ShareGoalForm thrustAreas={thrustAreas} candidates={candidates} />
    </div>
  );
}