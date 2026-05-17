import { NextResponse } from 'next/server';
import { runEscalationScan } from '@/lib/actions/escalations';

export const runtime = 'nodejs';

export async function POST() {
  const r = await runEscalationScan();
  return NextResponse.json(r);
}