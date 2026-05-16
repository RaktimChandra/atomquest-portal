'use client';

import { motion } from 'framer-motion';
import { scoreTone } from '@/lib/score-engine';
import { cn } from '@/lib/utils';

export function ScoreGauge({ score, size = 100, strokeWidth = 8, showLabel = true }: { score: number; size?: number; strokeWidth?: number; showLabel?: boolean }) {
  const tone = scoreTone(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDasharray: '0 ' + circumference }}
          animate={{ strokeDasharray: dash + ' ' + (circumference - dash) }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
          style={{ filter: 'drop-shadow(0 0 6px ' + tone.color + '40)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={score}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn('font-display font-bold tracking-tight', tone.tone)}
          style={{ fontSize: size * 0.28 }}
        >
          {Math.round(score)}
        </motion.div>
        {showLabel && size > 80 && (
          <div className={cn('text-[10px] uppercase tracking-wider mt-0.5 font-medium', tone.tone)}>{tone.label}</div>
        )}
      </div>
    </div>
  );
}