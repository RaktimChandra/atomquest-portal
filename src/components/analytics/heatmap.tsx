'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Row = { department: string; q1: number; q2: number; q3: number; q4: number };

export function Heatmap({ data }: { data: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-2 text-xs uppercase tracking-wide text-muted-foreground font-medium pr-3">Department</th>
            {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
              <th key={q} className="text-center py-2 text-xs uppercase tracking-wide text-muted-foreground font-medium px-1">{q}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <motion.tr key={r.department} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <td className="py-1.5 pr-3 font-medium text-sm">{r.department}</td>
              <HeatCell pct={r.q1} />
              <HeatCell pct={r.q2} />
              <HeatCell pct={r.q3} />
              <HeatCell pct={r.q4} />
            </motion.tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">No data yet.</td></tr>
          )}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">0%</span>
        <div className="h-2 flex-1 max-w-[200px] rounded-full" style={{ background: 'linear-gradient(to right, rgba(239,68,68,0.4), rgba(245,158,11,0.5), rgba(16,185,129,0.6))' }} />
        <span className="text-muted-foreground">100%</span>
      </div>
    </div>
  );
}

function HeatCell({ pct }: { pct: number }) {
  const tone =
    pct >= 90 ? { bg: 'rgba(16,185,129,0.30)', border: 'rgba(16,185,129,0.5)', text: 'text-emerald-300' }
    : pct >= 60 ? { bg: 'rgba(34,197,94,0.20)', border: 'rgba(34,197,94,0.4)', text: 'text-green-300' }
    : pct >= 30 ? { bg: 'rgba(245,158,11,0.20)', border: 'rgba(245,158,11,0.4)', text: 'text-amber-300' }
    : pct > 0   ? { bg: 'rgba(239,68,68,0.18)', border: 'rgba(239,68,68,0.4)', text: 'text-rose-300' }
    : { bg: 'rgba(113,113,122,0.10)', border: 'rgba(113,113,122,0.25)', text: 'text-muted-foreground' };

  return (
    <td className="px-1 py-1.5">
      <div
        className={cn('rounded-md py-2.5 text-center text-xs font-semibold border', tone.text)}
        style={{ background: tone.bg, borderColor: tone.border }}
      >
        {pct}%
      </div>
    </td>
  );
}