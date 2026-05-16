import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ApprovalDetail } from '@/components/manager/approval-detail';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default async function ApprovalDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = await params;
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') redirect('/dashboard');

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, name: true, email: true, designation: true, department: true, managerId: true },
  });
  if (!employee) notFound();
  if (employee.managerId !== session.user.id && session.user.role !== 'ADMIN') redirect('/dashboard/approvals');

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <Card><CardContent className="p-10 text-center text-muted-foreground">No active cycle.</CardContent></Card>;

  const goals = await prisma.goal.findMany({
    where: { ownerId: employeeId, cycleId: cycle.id },
    include: { thrustArea: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Link href="/dashboard/approvals" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to approvals
        </Link>
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
          <Sparkles className="h-3 w-3" /> {cycle.name}
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient">{employee.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">{employee.designation ?? ''} {employee.department ? '· ' + employee.department : ''} · {employee.email}</p>
      </div>

      <ApprovalDetail
        employeeId={employee.id}
        employeeName={employee.name}
        goals={goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          status: g.status,
          thrustArea: { name: g.thrustArea.name, color: g.thrustArea.color },
          uomType: g.uomType,
          uomUnit: g.uomUnit,
          target: g.target,
          targetDate: g.targetDate?.toISOString() ?? null,
          weightage: g.weightage,
          submittedAt: g.submittedAt?.toISOString() ?? null,
          approvedAt: g.approvedAt?.toISOString() ?? null,
          rejectionReason: g.rejectionReason,
        }))}
      />
    </div>
  );
}