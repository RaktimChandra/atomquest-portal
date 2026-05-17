import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OrgManager } from '@/components/admin/org-manager';
import { Users, Sparkles } from 'lucide-react';

export default async function OrgPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      designation: true,
      managerId: true,
      manager: { select: { name: true } },
      _count: { select: { reports: true, ownedGoals: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
          <Sparkles className="h-3 w-3" /> Admin
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-gradient flex items-center gap-3">
          <Users className="h-8 w-8 text-atom-400" /> Org Hierarchy
        </h1>
        <p className="text-muted-foreground text-sm">Manage reporting lines, roles, and departments. Changes are audit-logged.</p>
      </div>

      <OrgManager
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          designation: u.designation,
          managerId: u.managerId,
          managerName: u.manager?.name ?? null,
          reportCount: u._count.reports,
          goalCount: u._count.ownedGoals,
        }))}
      />
    </div>
  );
}