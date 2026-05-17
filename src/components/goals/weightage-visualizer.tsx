'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

interface Slice {
  weightage: number;
  color: string;
  label: string;
}

export function WeightageVisualizer({ slices, size = 240, strokeWidth = 28 }: { slices: Slice[]; size?: number; strokeWidth?: number }) {
  const total = slices.reduce((s, sl) => s + sl.weightage, 0);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

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

  let status = {
    icon: MinusCircle as typeof CheckCircle2,
    tone: 'text-muted-foreground',
    label: total === 0 ? 'No goals added' : (100 - total).toFixed(0) + '% remaining',
  };
  if (isOver) status = { icon: AlertCircle, tone: 'text-rose-500', label: 'Over by ' + (total - 100).toFixed(0) + '%' };
  else if (isComplete) status = { icon: CheckCircle2, tone: 'text-emerald-500', label: 'Perfectly balanced' };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div
        className="absolute rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: isComplete ? 'radial-gradient(circle, #10b981 0%, transparent 70%)' : isOver ? 'radial-gradient(circle, #ef4444 0%, transparent 70%)' : 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
        }}
      />

      <svg width={size} height={size} className="-rotate-90 relative">
        <defs>
          {arcs.map((a) => (
            <linearGradient key={'grad-' + a.key} id={'arc-grad-' + a.key} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={a.color} stopOpacity="1" />
              <stop offset="100%" stopColor={a.color} stopOpacity="0.75" />
            </linearGradient>
          ))}
          <filter id="arc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />

        {/* Arcs with gradient + glow */}
        {arcs.map((a) => (
          <motion.circle
            key={a.key}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={'url(#arc-grad-' + a.key + ')'}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            filter="url(#arc-glow)"
            initial={{ strokeDasharray: '0 ' + circumference, strokeDashoffset: -a.offset }}
            animate={{ strokeDasharray: a.dash + ' ' + (circumference - a.dash), strokeDashoffset: -a.offset }}
            transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          />
        ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.div
          key={total}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'font-display font-bold tracking-tight tnum',
            isOver ? 'text-rose-500' : isComplete ? 'text-emerald-500' : 'text-foreground'
          )}
          style={{ fontSize: size * 0.22 }}
        >
          {total.toFixed(0)}
          <span className="text-muted-foreground" style={{ fontSize: size * 0.12 }}>%</span>
        </motion.div>
        <div className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', status.tone)}>
          <status.icon className="h-3.5 w-3.5" />
          {status.label}
        </div>
      </div>
    </div>
  );
}