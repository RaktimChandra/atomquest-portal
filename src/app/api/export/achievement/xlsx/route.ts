import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import ExcelJS from 'exceljs';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return new NextResponse('No active cycle', { status: 404 });

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

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AtomQuest Portal';
  wb.created = new Date();

  const ws = wb.addWorksheet('Achievement', {
    properties: { tabColor: { argb: 'FF6366F1' } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'Employee', key: 'employee', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Department', key: 'department', width: 18 },
    { header: 'Designation', key: 'designation', width: 22 },
    { header: 'Goal Title', key: 'title', width: 38 },
    { header: 'Thrust Area', key: 'thrustArea', width: 22 },
    { header: 'UoM Type', key: 'uomType', width: 18 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Target', key: 'target', width: 12 },
    { header: 'Target Date', key: 'targetDate', width: 14 },
    { header: 'Weightage %', key: 'weightage', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Q1 Actual', key: 'q1Actual', width: 12 },
    { header: 'Q1 Status', key: 'q1Status', width: 14 },
    { header: 'Q1 Score', key: 'q1Score', width: 10 },
    { header: 'Q2 Actual', key: 'q2Actual', width: 12 },
    { header: 'Q2 Status', key: 'q2Status', width: 14 },
    { header: 'Q2 Score', key: 'q2Score', width: 10 },
    { header: 'Q3 Actual', key: 'q3Actual', width: 12 },
    { header: 'Q3 Status', key: 'q3Status', width: 14 },
    { header: 'Q3 Score', key: 'q3Score', width: 10 },
    { header: 'Q4 Actual', key: 'q4Actual', width: 12 },
    { header: 'Q4 Status', key: 'q4Status', width: 14 },
    { header: 'Q4 Score', key: 'q4Score', width: 10 },
  ];

  // Header styling
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
  header.height = 22;

  for (const u of users) {
    for (const g of u.ownedGoals) {
      const cis: Record<string, any> = {};
      for (const c of g.checkIns) cis[c.quarter] = c;

      ws.addRow({
        employee: u.name,
        email: u.email,
        department: u.department ?? '',
        designation: u.designation ?? '',
        title: g.title,
        thrustArea: g.thrustArea.name,
        uomType: g.uomType,
        unit: g.uomUnit ?? '',
        target: g.target ?? '',
        targetDate: g.targetDate ? g.targetDate.toISOString().slice(0, 10) : '',
        weightage: g.weightage,
        status: g.status,
        q1Actual: cis.Q1?.actualValue ?? '', q1Status: cis.Q1?.status ?? '', q1Score: cis.Q1?.computedScore ?? '',
        q2Actual: cis.Q2?.actualValue ?? '', q2Status: cis.Q2?.status ?? '', q2Score: cis.Q2?.computedScore ?? '',
        q3Actual: cis.Q3?.actualValue ?? '', q3Status: cis.Q3?.status ?? '', q3Score: cis.Q3?.computedScore ?? '',
        q4Actual: cis.Q4?.actualValue ?? '', q4Status: cis.Q4?.status ?? '', q4Score: cis.Q4?.computedScore ?? '',
      });
    }
  }

  // Banded rows
  ws.eachRow({ includeEmpty: false }, (row, idx) => {
    if (idx === 1) return;
    if (idx % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5FA' } };
  });

  // Auto filter
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 24 } };

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'Export',
    entityId: cycle.id,
    metadata: 'Excel achievement export · ' + users.length + ' users',
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="atomquest-achievement.xlsx"',
    },
  });
}