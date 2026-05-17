import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CyclesManager } from '@/components/admin/cycles-manager';
import { Settings, Sparkles } from 'lucide-react';

export default async function CyclesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const cycles = await prisma.cycle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { thrustAreas: { orderBy: { name: 'asc' } } },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> Admin · Configuration
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <Settings className="h-8 w-8 text-atom-400" /> Cycles & Thrust Areas
        </h1>
        <p className="text-muted-foreground text-sm">Configure performance cycles, quarter windows, and thrust areas. Only one cycle can be active at a time.</p>
      </div>

      <CyclesManager
        cycles={cycles.map((c) => ({
          id: c.id,
          name: c.name,
          fiscalYear: c.fiscalYear,
          phase: c.phase,
          isActive: c.isActive,
          goalSettingOpen: c.goalSettingOpen.toISOString(),
          goalSettingClose: c.goalSettingClose.toISOString(),
          q1Open: c.q1Open.toISOString(),
          q1Close: c.q1Close.toISOString(),
          q2Open: c.q2Open.toISOString(),
          q2Close: c.q2Close.toISOString(),
          q3Open: c.q3Open.toISOString(),
          q3Close: c.q3Close.toISOString(),
          q4Open: c.q4Open.toISOString(),
          q4Close: c.q4Close.toISOString(),
          thrustAreas: c.thrustAreas.map((t) => ({ id: t.id, name: t.name, description: t.description, color: t.color })),
        }))}
      />
    </div>
  );
}