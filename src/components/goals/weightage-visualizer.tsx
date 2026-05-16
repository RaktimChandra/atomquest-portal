'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

interface Slice {
  weightage: number;
  color: string;
  label: string;
}

export function WeightageVisualizer({ slices, size = 220, strokeWidth = 24 }: { slices: Slice[]; size?: number; strokeWidth?: number }) {
  const total = slices.reduce((s, sl) => s + sl.weightage, 0);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Build cumulative arcs
  let cumulative = 0;
  const arcs = slices.map((sl, i) => {
    const fraction = sl.weightage / 100;
    const dash = fraction * circumference;
    const offset = (cumulative / 100) * circumference;
    cumulative += sl.weightage;
    return { ...sl, dash, offset, key: i };
  });

  const isComplete = Math.abs(total - 100) < 0.01;
  const isOver = total > 100;

  let status: { icon: typeof CheckCircle2; tone: string; label: string } = {
    icon: MinusCircle,
    tone: 'text-muted-foreground',
    label: total === 0 ? 'No goals added' : `${(100 - total).toFixed(0)}% remaining`,
  };
  if (isOver) status = { icon: AlertCircle, tone: 'text-rose-400', label: `Over by ${(total - 100).toFixed(0)}%` };
  else if (isComplete) status = { icon: CheckCircle2, tone: 'text-emerald-400', label: 'Perfectly balanced' };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        {/* Arcs */}
        {arcs.map((a) => (
          <motion.circle
            key={a.key}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={a.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            initial={{ strokeDasharray: `0 ${circumference}`, strokeDashoffset: -a.offset }}
            animate={{ strokeDasharray: `${a.dash} ${circumference - a.dash}`, strokeDashoffset: -a.offset }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
            style={{ filter: 'drop-shadow(0 0 8px ' + a.color + '40)' }}
          />
        ))}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.div
          key={total}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'font-display text-5xl font-bold tracking-tight',
            isOver ? 'text-rose-400' : isComplete ? 'text-emerald-400' : 'text-foreground'
          )}
        >
          {total.toFixed(0)}
          <span className="text-2xl text-muted-foreground">%</span>
        </motion.div>
        <div className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', status.tone)}>
          <status.icon className="h-3.5 w-3.5" />
          {status.label}
        </div>
      </div>
    </div>
  );
}
