import { PrismaClient, Role, UoMType, CyclePhase, GoalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AtomQuest database...');

  // Clean slate
  await prisma.escalation.deleteMany();
  await prisma.escalationRule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.managerCheckIn.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.sharedGoalRecipient.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('demo1234', 10);

  // ============ USERS ============
  const admin = await prisma.user.create({
    data: {
      email: 'admin@atomberg.com',
      name: 'Priya Sharma',
      password: hashedPassword,
      role: Role.ADMIN,
      department: 'Human Resources',
      designation: 'HR Director',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@atomberg.com',
      name: 'Rohan Kapoor',
      password: hashedPassword,
      role: Role.MANAGER,
      department: 'Engineering',
      designation: 'Engineering Manager',
      managerId: admin.id,
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@atomberg.com',
      name: 'Anjali Verma',
      password: hashedPassword,
      role: Role.MANAGER,
      department: 'Sales',
      designation: 'Regional Sales Head',
      managerId: admin.id,
    },
  });

  const employee = await prisma.user.create({
    data: {
      email: 'employee@atomberg.com',
      name: 'Arjun Patel',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Senior Software Engineer',
      managerId: manager.id,
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'employee2@atomberg.com',
      name: 'Sneha Iyer',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      department: 'Engineering',
      designation: 'Product Designer',
      managerId: manager.id,
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      email: 'employee3@atomberg.com',
      name: 'Vikram Singh',
      password: hashedPassword,
      role: Role.EMPLOYEE,
      department: 'Sales',
      designation: 'Sales Executive',
      managerId: manager2.id,
    },
  });

  console.log('✅ Users created');

  // ============ CYCLE ============
  const now = new Date();
  const year = now.getFullYear();

  const cycle = await prisma.cycle.create({
    data: {
      name: `FY ${year}-${(year + 1).toString().slice(2)}`,
      fiscalYear: `${year}-${(year + 1).toString().slice(2)}`,
      phase: CyclePhase.GOAL_SETTING,
      isActive: true,
      goalSettingOpen: new Date(year, 3, 1),    // 1 May
      goalSettingClose: new Date(year, 5, 30),  // 30 June
      q1Open: new Date(year, 6, 1),             // July
      q1Close: new Date(year, 6, 31),
      q2Open: new Date(year, 9, 1),             // October
      q2Close: new Date(year, 9, 31),
      q3Open: new Date(year + 1, 0, 1),         // January next year
      q3Close: new Date(year + 1, 0, 31),
      q4Open: new Date(year + 1, 2, 1),         // March-April
      q4Close: new Date(year + 1, 3, 30),
    },
  });

  // ============ THRUST AREAS ============
  const thrustAreas = await Promise.all([
    prisma.thrustArea.create({ data: { name: 'Revenue Growth', color: '#10b981', cycleId: cycle.id, description: 'Top-line business outcomes' } }),
    prisma.thrustArea.create({ data: { name: 'Operational Excellence', color: '#6366f1', cycleId: cycle.id, description: 'Process & efficiency' } }),
    prisma.thrustArea.create({ data: { name: 'Customer Experience', color: '#f59e0b', cycleId: cycle.id, description: 'NPS, retention, satisfaction' } }),
    prisma.thrustArea.create({ data: { name: 'Innovation & R&D', color: '#ec4899', cycleId: cycle.id, description: 'New products, IP, research' } }),
    prisma.thrustArea.create({ data: { name: 'People & Culture', color: '#8b5cf6', cycleId: cycle.id, description: 'Talent, engagement, learning' } }),
    prisma.thrustArea.create({ data: { name: 'Safety & Compliance', color: '#ef4444', cycleId: cycle.id, description: 'Zero-incident targets' } }),
  ]);

  console.log('✅ Cycle & thrust areas created');

  // ============ SAMPLE GOALS for employee ============
  await prisma.goal.create({
    data: {
      title: 'Ship Atomberg Smart Fan v3 firmware',
      description: 'Lead firmware release for the next-gen smart fan with BLE mesh and Matter support.',
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[3].id, // Innovation
      uomType: UoMType.TIMELINE,
      uomUnit: 'date',
      targetDate: new Date(year, 8, 30),
      weightage: 30,
      status: GoalStatus.APPROVED,
      submittedAt: new Date(year, 3, 10),
      approvedAt: new Date(year, 3, 15),
      approverId: manager.id,
      lockedAt: new Date(year, 3, 15),
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Reduce production defect rate',
      description: 'Bring down DPMO in fan-motor assembly line.',
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[1].id, // Operational Excellence
      uomType: UoMType.NUMERIC_MAX, // lower is better
      uomUnit: 'DPMO',
      target: 200,
      weightage: 25,
      status: GoalStatus.APPROVED,
      submittedAt: new Date(year, 3, 10),
      approvedAt: new Date(year, 3, 15),
      approverId: manager.id,
      lockedAt: new Date(year, 3, 15),
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Maintain zero P0 production incidents',
      description: 'Zero critical safety/production incidents during the fiscal year.',
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[5].id, // Safety
      uomType: UoMType.ZERO_BASED,
      uomUnit: 'incidents',
      target: 0,
      weightage: 20,
      status: GoalStatus.APPROVED,
      submittedAt: new Date(year, 3, 10),
      approvedAt: new Date(year, 3, 15),
      approverId: manager.id,
      lockedAt: new Date(year, 3, 15),
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Drive engineering team NPS above 70',
      description: 'Improve internal engineering engagement score.',
      ownerId: employee.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[4].id, // People
      uomType: UoMType.NUMERIC_MIN,
      uomUnit: 'NPS',
      target: 70,
      weightage: 25,
      status: GoalStatus.DRAFT,
    },
  });

  // Sample submitted goal awaiting manager approval (so manager has something to review)
  await prisma.goal.create({
    data: {
      title: 'Launch Design System v2',
      description: 'Ship the unified component library across all Atomberg digital products.',
      ownerId: emp2.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[3].id,
      uomType: UoMType.TIMELINE,
      targetDate: new Date(year, 11, 31),
      weightage: 40,
      status: GoalStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Achieve 30% improvement in checkout conversion',
      description: 'Redesign the checkout flow on Atomberg.com.',
      ownerId: emp2.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[2].id,
      uomType: UoMType.PERCENTAGE_MIN,
      uomUnit: '%',
      target: 30,
      weightage: 35,
      status: GoalStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Mentor 3 junior designers',
      description: 'Run structured mentorship program through the year.',
      ownerId: emp2.id,
      cycleId: cycle.id,
      thrustAreaId: thrustAreas[4].id,
      uomType: UoMType.NUMERIC_MIN,
      uomUnit: 'people',
      target: 3,
      weightage: 25,
      status: GoalStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  console.log('✅ Sample goals created');

  // Default escalation rules
  await prisma.escalationRule.createMany({
    data: [
      { name: 'Goal Submission Overdue', triggerEvent: 'GOAL_NOT_SUBMITTED', thresholdDays: 7, escalateTo: 'MANAGER' },
      { name: 'Approval Pending', triggerEvent: 'APPROVAL_PENDING', thresholdDays: 5, escalateTo: 'SKIP_LEVEL' },
      { name: 'Check-in Overdue', triggerEvent: 'CHECKIN_OVERDUE', thresholdDays: 10, escalateTo: 'HR' },
    ],
  });

  console.log('✅ Escalation rules created');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials (password: demo1234):');
  console.log('   👑 Admin:    admin@atomberg.com');
  console.log('   👔 Manager:  manager@atomberg.com');
  console.log('   💼 Employee: employee@atomberg.com');
  console.log('   💼 Designer: employee2@atomberg.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
