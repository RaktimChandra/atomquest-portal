/**
 * Score Engine — auto-computes progress score (0-100) per goal
 * based on UoM type and actual vs target.
 *
 * Formulas (from BRD):
 *   - NUMERIC_MIN / PERCENTAGE_MIN (higher better): actual / target
 *   - NUMERIC_MAX / PERCENTAGE_MAX (lower better):  target / actual
 *   - TIMELINE: completion date vs deadline
 *   - ZERO_BASED: 0 -> 100%, else 0%
 */

export type UomType =
  | 'NUMERIC_MIN'
  | 'NUMERIC_MAX'
  | 'PERCENTAGE_MIN'
  | 'PERCENTAGE_MAX'
  | 'TIMELINE'
  | 'ZERO_BASED';

export function computeScore(args: {
  uomType: UomType;
  target: number | null;
  actualValue: number | null;
  targetDate: Date | string | null;
  actualDate: Date | string | null;
}): number {
  const { uomType, target, actualValue, targetDate, actualDate } = args;

  switch (uomType) {
    case 'NUMERIC_MIN':
    case 'PERCENTAGE_MIN': {
      if (target === null || target === 0) return 0;
      if (actualValue === null) return 0;
      return clamp((actualValue / target) * 100, 0, 100);
    }

    case 'NUMERIC_MAX':
    case 'PERCENTAGE_MAX': {
      if (target === null) return 0;
      if (actualValue === null) return 0;
      if (target === 0) return actualValue === 0 ? 100 : 0;
      if (actualValue === 0) return 100;
      return clamp((target / actualValue) * 100, 0, 100);
    }

    case 'TIMELINE': {
      if (!targetDate) return 0;
      if (!actualDate) return 0;
      const td = new Date(targetDate).getTime();
      const ad = new Date(actualDate).getTime();
      if (ad <= td) return 100;
      // Linear penalty: every 1 day late after deadline = 2 points loss, capped at 0
      const daysLate = (ad - td) / (1000 * 60 * 60 * 24);
      return clamp(100 - daysLate * 2, 0, 100);
    }

    case 'ZERO_BASED': {
      if (actualValue === null) return 0;
      return actualValue === 0 ? 100 : 0;
    }

    default:
      return 0;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Aggregate weighted score for a set of goals (each goal has its own weightage and score). */
export function aggregateScore(goals: { weightage: number; score: number }[]): number {
  if (goals.length === 0) return 0;
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight === 0) return 0;
  const weighted = goals.reduce((s, g) => s + g.score * g.weightage, 0);
  return clamp(weighted / totalWeight, 0, 100);
}

/** Format score with appropriate tone tag for UI */
export function scoreTone(score: number): { label: string; color: string; tone: string } {
  if (score >= 90) return { label: 'Outstanding', color: '#10b981', tone: 'text-emerald-400' };
  if (score >= 75) return { label: 'On Track',    color: '#22c55e', tone: 'text-green-400' };
  if (score >= 50) return { label: 'Progressing', color: '#f59e0b', tone: 'text-amber-400' };
  if (score > 0)   return { label: 'At Risk',     color: '#ef4444', tone: 'text-rose-400' };
  return { label: 'Not Started', color: '#71717a', tone: 'text-muted-foreground' };
}

/** Determine which quarter window is currently open based on date. Returns null if none. */
export function currentQuarter(now: Date = new Date()): 'Q1' | 'Q2' | 'Q3' | 'Q4' | null {
  const m = now.getMonth(); // 0-11
  if (m === 6) return 'Q1'; // July
  if (m === 9) return 'Q2'; // October
  if (m === 0) return 'Q3'; // January
  if (m === 2 || m === 3) return 'Q4'; // March-April
  return null;
}

/** All quarters with their human-readable windows */
export const QUARTER_LABELS: Record<string, { label: string; window: string }> = {
  Q1: { label: 'Q1 Check-in', window: 'July' },
  Q2: { label: 'Q2 Check-in', window: 'October' },
  Q3: { label: 'Q3 Check-in', window: 'January' },
  Q4: { label: 'Q4 / Annual',  window: 'March – April' },
};