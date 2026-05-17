'use client';

import { motion } from 'framer-motion';
import { Users, ClipboardCheck, CheckCircle2, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type DeptRow = {
  department: string;
  totalUsers: number;
  submittedSheets: number;
  approvedSheets: number;
  qCheckInsDone: number;
};

export function CompletionDashboard({ deptData, totals, quarter }: { deptData: DeptRow[]; totals: { users: number; submittedSheets: number; approvedSheets: number; qCheckIns: number }; quarter: string }) {
  return (
    <>
      {/* Top-level metric tiles */}
      <div className="grid sm:grid-cols-4 gap-3">
        <MetricTile icon={Users} label="Total people" value={totals.users} sub="In scope" color="from-atom-500 to-indigo-600" />
        <MetricTile icon={ClipboardCheck} label="Submitted" value={totals.submittedSheets} sub={pct(totals.submittedSheets, totals.users) + '% of total'} color="from-amber-500 to-orange-600" />
        <MetricTile icon={CheckCircle2} label="Approved" value={totals.approvedSheets} sub={pct(totals.approvedSheets, totals.users) + '% of total'} color="from-emerald-500 to-teal-600" />
        <MetricTile icon={ListChecks} label={quarter + ' check-ins'} value={totals.qCheckIns} sub={pct(totals.qCheckIns, totals.users) + '% complete'} color="from-purple-500 to-pink-600" />
      </div>

      {/* Department breakdown */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">By department</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="text-left py-2 font-medium">Department</th>
                  <th className="text-right py-2 font-medium">People</th>
                  <th className="text-right py-2 font-medium">Submitted</th>
                  <th className="text-right py-2 font-medium">Approved</th>
                  <th className="text-right py-2 font-medium">{quarter} check-ins</th>
                </tr>
              </thead>
              <tbody>
                {deptData.map((d, i) => (
                  <motion.tr key={d.department} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="border-b border-border/20 hover:bg-accent/20">
                    <td className="py-3 font-medium">{d.department}</td>
                    <td className="py-3 text-right">{d.totalUsers}</td>
                    <td className="py-3 text-right"><HeatCell value={d.submittedSheets} total={d.totalUsers} /></td>
                    <td className="py-3 text-right"><HeatCell value={d.approvedSheets} total={d.totalUsers} /></td>
                    <td className="py-3 text-right"><HeatCell value={d.qCheckInsDone} total={d.totalUsers} /></td>
                  </motion.tr>
                ))}
                {deptData.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No data yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function HeatCell({ value, total }: { value: number; total: number }) {
  const p = pct(value, total);
  const tone =
    p >= 90 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : p >= 60 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : p > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : 'bg-muted/30 text-muted-foreground border-border/40';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone)}>
      {value}/{total} <span className="opacity-70">·</span> {p}%
    </span>
  );
}

function MetricTile({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub: string; color: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={'absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ' + color + ' opacity-15 blur-2xl'} />
      <CardContent className="p-5 relative">
        <div className={'h-9 w-9 rounded-lg bg-gradient-to-br ' + color + ' flex items-center justify-center shadow-glow-sm mb-3'}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-xs font-medium mt-0.5">{label}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}