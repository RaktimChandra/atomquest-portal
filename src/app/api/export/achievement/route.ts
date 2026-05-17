import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return new NextResponse('No active cycle', { status: 404 });

  // Scope: admin sees all, manager sees their reports
  const userFilter = session.user.role === 'ADMIN' ? {} : { managerId: session.user.id };

  const users = await prisma.user.findMany({
    where: userFilter,
    include: {
      ownedGoals: {
        where: { cycleId: cycle.id },
        include: { thrustArea: true, checkIns: true },
      },
    },
    orderBy: [{ department: 'asc' }, { name: 'asc' }],
  });

  const headers = [
    'Employee', 'Email', 'Department', 'Designation',
    'Goal Title', 'Thrust Area', 'UoM Type', 'Unit',
    'Target', 'Target Date', 'Weightage (%)', 'Status',
    'Q1 Actual', 'Q1 Status', 'Q1 Score',
    'Q2 Actual', 'Q2 Status', 'Q2 Score',
    'Q3 Actual', 'Q3 Status', 'Q3 Score',
    'Q4 Actual', 'Q4 Status', 'Q4 Score',
  ];

  const rows: string[] = [headers.map(csvCell).join(',')];

  for (const u of users) {
    for (const g of u.ownedGoals) {
      const cis: Record<string, any> = {};
      for (const c of g.checkIns) cis[c.quarter] = c;

      const row = [
        u.name, u.email, u.department ?? '', u.designation ?? '',
        g.title, g.thrustArea.name, g.uomType, g.uomUnit ?? '',
        g.target?.toString() ?? '', g.targetDate ? g.targetDate.toISOString().slice(0, 10) : '',
        g.weightage.toString(), g.status,
        cis.Q1?.actualValue?.toString() ?? '', cis.Q1?.status ?? '', cis.Q1?.computedScore?.toFixed(1) ?? '',
        cis.Q2?.actualValue?.toString() ?? '', cis.Q2?.status ?? '', cis.Q2?.computedScore?.toFixed(1) ?? '',
        cis.Q3?.actualValue?.toString() ?? '', cis.Q3?.status ?? '', cis.Q3?.computedScore?.toFixed(1) ?? '',
        cis.Q4?.actualValue?.toString() ?? '', cis.Q4?.status ?? '', cis.Q4?.computedScore?.toFixed(1) ?? '',
      ];
      rows.push(row.map(csvCell).join(','));
    }
  }

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Export',
    entityId: cycle.id,
    metadata: 'CSV achievement export · ' + users.length + ' users',
  });

  return new NextResponse(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="atomquest-achievement.csv"',
    },
  });
}

function csvCell(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}