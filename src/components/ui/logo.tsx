'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * The AtomQuest brand mark — a quark monogram.
 * An open orbit ring crossed by a small filled sphere ("the quark").
 * On hover, the quark travels once around the orbit.
 */
export function Logo({ size = 32, className, animated = true, withWordmark = true, href = '/' }: { size?: number; className?: string; animated?: boolean; withWordmark?: boolean; href?: string | null }) {
  const inner = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
        whileHover={animated ? 'hover' : undefined}
        initial="idle"
      >
        <svg viewBox="0 0 40 40" className="absolute inset-0">
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--brand-from))" />
              <stop offset="100%" stopColor="hsl(var(--brand-to))" />
            </linearGradient>
            <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring (orbit) */}
          <motion.circle
            cx="20" cy="20" r="14"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="60 30"
            variants={{
              idle: { rotate: 0, opacity: 1 },
              hover: { rotate: 360, opacity: 1 },
            }}
            transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
            style={{ transformOrigin: 'center' }}
          />

          {/* Inner orbit hint (thinner, faded) */}
          <circle
            cx="20" cy="20" r="9"
            fill="none"
            stroke="url(#logo-grad)"
            strokeWidth="1"
            strokeOpacity="0.35"
          />

          {/* The quark (filled sphere) */}
          <motion.circle
            cx="34" cy="20" r="3.4"
            fill="url(#logo-grad)"
            filter="url(#logo-glow)"
            variants={{
              idle: { pathLength: 0 },
              hover: { rotate: 360 },
            }}
            style={{ transformOrigin: '20px 20px' }}
            transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
          />

          {/* Center nucleus */}
          <circle cx="20" cy="20" r="1.6" fill="hsl(var(--foreground))" />
        </svg>
      </motion.div>

      {withWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-bold tracking-tight text-foreground" style={{ fontSize: size * 0.55 }}>
            AtomQuest
          </span>
          <span className="text-muted-foreground uppercase tracking-[0.18em] mt-0.5" style={{ fontSize: size * 0.26 }}>
            Goal Portal
          </span>
        </div>
      )}
    </div>
  );

  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}