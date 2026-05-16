import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApprovalInbox } from '@/components/manager/approval-inbox';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardCheck, Sparkles, Users } from 'lucide-react';

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Approvals</h1>
        <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>
      </div>
    );
  }

  // Get all direct reports with their submitted/approved/returned goals
  const reports = await prisma.user.findMany({
    where: session.user.role === 'ADMIN' ? {} : { managerId: session.user.id },
    include: {
      ownedGoals: {
        where: { cycleId: cycle.id },
        include: { thrustArea: true },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const reportsWithSummary = reports
    .filter((r) => r.id !== session.user.id) // don't show self
    .map((r) => {
      const submitted = r.ownedGoals.filter((g) => g.status === 'SUBMITTED');
      const approved = r.ownedGoals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED');
      const returned = r.ownedGoals.filter((g) => g.status === 'RETURNED');
      const draft = r.ownedGoals.filter((g) => g.status === 'DRAFT');

      let status: 'pending' | 'approved' | 'returned' | 'draft' | 'empty' = 'empty';
      if (submitted.length > 0) status = 'pending';
      else if (approved.length > 0) status = 'approved';
      else if (returned.length > 0) status = 'returned';
      else if (draft.length > 0) status = 'draft';

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        designation: r.designation,
        department: r.department,
        goals: r.ownedGoals,
        submitted,
        approved,
        returned,
        draft,
        status,
        totalSubmittedWeight: submitted.reduce((s, g) => s + g.weightage, 0),
      };
    });

  const pendingCount = reportsWithSummary.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> {cycle.name}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">Approvals</h1>
        <p className="text-muted-foreground text-sm">
          {pendingCount > 0 ? `${pendingCount} goal sheet${pendingCount !== 1 ? 's' : ''} awaiting your review.` : 'All caught up. No pending approvals.'}
        </p>
      </div>

      {reportsWithSummary.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-atom-500/10 mx-auto flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-atom-400" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-1.5">No reports assigned</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">Once team members are mapped to you in the org hierarchy, their goal sheets appear here for approval.</p>
          </CardContent>
        </Card>
      ) : (
        <ApprovalInbox reports={reportsWithSummary} />
      )}
    </div>
  );
}