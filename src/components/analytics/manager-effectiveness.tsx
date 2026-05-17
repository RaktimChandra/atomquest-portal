'use client';

import { motion } from 'framer-motion';
import { Crown, Users } from 'lucide-react';
import { initials } from '@/lib/utils';
import { ScoreGauge } from '@/components/checkins/score-gauge';

type Row = { managerId: string; managerName: string; department: string; reportCount: number; checkInRate: number; avgScore: number };

export function ManagerEffectiveness({ data }: { data: Row[] }) {
  if (data.length === 0) {
    return <div className="text-center text-sm text-muted-foreground py-10">No managers in scope.</div>;
  }

  return (
    <div className="space-y-3">
      {data.map((r, i) => (
        <motion.div
          key={r.managerId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 p-3"
        >
          <div className="flex items-center gap-2 flex-shrink-0 w-8 text-center">
            {i === 0 && <Crown className="h-4 w-4 text-amber-400" />}
            <span className="font-display text-sm font-bold text-muted-foreground">#{i + 1}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {initials(r.managerName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{r.managerName}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="h-3 w-3" /> {r.reportCount} reports · {r.department}
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right gap-1">
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: r.checkInRate >= 75 ? '#10b981' : r.checkInRate >= 50 ? '#f59e0b' : '#ef4444' }}
                  initial={{ width: 0 }}
                  animate={{ width: r.checkInRate + '%' }}
                  transition={{ delay: i * 0.04 + 0.1, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-mono font-semibold w-10 text-right">{r.checkInRate}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">check-in rate</div>
          </div>
          <ScoreGauge score={r.avgScore} size={50} strokeWidth={5} showLabel={false} />
        </motion.div>
      ))}
    </div>
  );
}