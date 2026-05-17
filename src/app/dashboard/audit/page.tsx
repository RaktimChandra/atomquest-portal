import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditTimeline } from '@/components/audit/audit-timeline';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, FileText } from 'lucide-react';

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Scope based on role:
  // - ADMIN sees everything
  // - MANAGER sees their reports' + their own
  // - EMPLOYEE sees only their own
  let scopeFilter: any = {};
  if (session.user.role === 'EMPLOYEE') {
    scopeFilter = { userId: session.user.id };
  } else if (session.user.role === 'MANAGER') {
    const reports = await prisma.user.findMany({ where: { managerId: session.user.id }, select: { id: true } });
    const reportIds = reports.map((r) => r.id);
    scopeFilter = { OR: [{ userId: session.user.id }, { userId: { in: reportIds } }] };
  }

  const entries = await prisma.auditLog.findMany({
    where: scopeFilter,
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> Governance
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <FileText className="h-8 w-8 text-atom-400" /> Audit Trail
        </h1>
        <p className="text-muted-foreground text-sm">
          {session.user.role === 'ADMIN' && 'Org-wide log of every action — create, update, approve, lock, return, check-in, share.'}
          {session.user.role === 'MANAGER' && "All actions across your direct reports and your own."}
          {session.user.role === 'EMPLOYEE' && 'Every action you have taken — yours to reference at any time.'}
        </p>
      </div>

      <AuditTimeline
        entries={entries.map((e) => ({
          id: e.id,
          action: e.action,
          entityType: e.entityType,
          entityId: e.entityId,
          beforeJson: e.beforeJson,
          afterJson: e.afterJson,
          metadata: e.metadata,
          createdAt: e.createdAt.toISOString(),
          user: e.user,
        }))}
      />
    </div>
  );
}