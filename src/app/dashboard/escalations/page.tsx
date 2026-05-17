import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EscalationManager } from '@/components/admin/escalations/escalation-manager';
import { Zap, Sparkles } from 'lucide-react';

export default async function EscalationsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const [rules, escalations] = await Promise.all([
    prisma.escalationRule.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.escalation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { rule: true, targetUser: true },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> Admin · Governance
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <Zap className="h-8 w-8 text-atom-400" /> Escalations
        </h1>
        <p className="text-muted-foreground text-sm">Configurable rules trigger automatic escalations when thresholds breach. Run the scan manually or set up a cron in production.</p>
      </div>

      <EscalationManager
        rules={rules.map((r) => ({
          id: r.id, name: r.name, description: r.description, triggerEvent: r.triggerEvent,
          thresholdDays: r.thresholdDays, escalateTo: r.escalateTo, isActive: r.isActive,
        }))}
        escalations={escalations.map((e) => ({
          id: e.id,
          ruleName: e.rule.name,
          ruleEvent: e.rule.triggerEvent,
          targetName: e.targetUser.name,
          targetEmail: e.targetUser.email,
          reason: e.reason,
          isResolved: e.isResolved,
          createdAt: e.createdAt.toISOString(),
          resolvedAt: e.resolvedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}