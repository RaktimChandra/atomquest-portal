import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatNumber(n: number | null | undefined, opts?: Intl.NumberFormatOptions) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-IN', opts).format(n);
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Compute the progress score for a goal based on UoM type.
 * Returns 0-100 (capped).
 */
export function computeGoalScore(
  uomType: string,
  target: number | null,
  actual: number | null,
  targetDate: Date | null,
  actualDate: Date | null
): number {
  switch (uomType) {
    case 'NUMERIC_MIN':
    case 'PERCENTAGE_MIN':
      // Higher is better
      if (!target || target === 0) return 0;
      if (actual === null) return 0;
      return Math.min(100, Math.max(0, (actual / target) * 100));

    case 'NUMERIC_MAX':
    case 'PERCENTAGE_MAX':
      // Lower is better
      if (!target || !actual || actual === 0) return target === 0 ? 100 : 0;
      return Math.min(100, Math.max(0, (target / actual) * 100));

    case 'TIMELINE':
      if (!targetDate) return 0;
      if (!actualDate) return 0;
      // Score: 100 if on/before deadline, decreases linearly
      const td = new Date(targetDate).getTime();
      const ad = new Date(actualDate).getTime();
      if (ad <= td) return 100;
      // Penalty: every 10% overshoot of remaining time = -10 pts (capped at 0)
      const buffer = td * 0.1;
      const overshoot = ad - td;
      return Math.max(0, 100 - (overshoot / buffer) * 10);

    case 'ZERO_BASED':
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}

export const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  ADMIN: 'Admin / HR',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  SUBMITTED: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
  RETURNED: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20',
  LOCKED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
  NOT_STARTED: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  ON_TRACK: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
  AT_RISK: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20',
  COMPLETED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20',
};

export const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: 'Numeric (higher is better)',
  NUMERIC_MAX: 'Numeric (lower is better)',
  PERCENTAGE_MIN: 'Percentage (higher is better)',
  PERCENTAGE_MAX: 'Percentage (lower is better)',
  TIMELINE: 'Timeline / Date',
  ZERO_BASED: 'Zero-based (0 = success)',
};
