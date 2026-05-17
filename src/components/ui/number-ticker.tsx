'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';

export function NumberTicker({ value, duration = 1.2, decimals = 0, suffix = '', className }: { value: number; duration?: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {decimals === 0 ? Math.round(display).toLocaleString('en-IN') : display.toFixed(decimals)}
      {suffix}
    </span>
  );
}