'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Target, ChevronDown, ChevronUp, Save, Loader2, CheckCircle2, Activity, AlertTriangle, Circle, Sparkles, Calendar, MessageSquare, Lock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScoreGauge } from './score-gauge';
import { saveCheckIn } from '@/lib/actions/checkins';
import { computeScore, scoreTone, type UomType } from '@/lib/score-engine';
import { cn, UOM_LABELS, formatDate } from '@/lib/utils';

type Goal = {
  id: string;
  title: string;
  description: string | null;
  thrustArea: { name: string; color: string };
  uomType: string;
  uomUnit: string | null;
  target: number | null;
  targetDate: string | null;
  weightage: number;
  checkIn: {
    id: string;
    actualValue: number | null;
    actualDate: string | null;
    status: string;
    selfComment: string | null;
    computedScore: number | null;
    managerComment: string | null;
  } | null;
};

type Props = {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  quarterLabel: string;
  goals: Goal[];
};

const statusOptions = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: Circle,          tone: 'text-slate-400'   },
  { value: 'ON_TRACK',    label: 'On Track',    icon: Activity,        tone: 'text-emerald-400' },
  { value: 'AT_RISK',     label: 'At Risk',     icon: AlertTriangle,   tone: 'text-amber-400'   },
  { value: 'COMPLETED',   label: 'Completed',   icon: CheckCircle2,    tone: 'text-indigo-400'  },
];

export function CheckInForm({ quarter, quarterLabel, goals }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(goals[0]?.id ?? null);

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {goals.map((g) => (
          <GoalCheckInRow
            key={g.id}
            goal={g}
            quarter={quarter}
            expanded={expandedId === g.id}
            onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
            onSaved={() => router.refresh()}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function GoalCheckInRow({ goal, quarter, expanded, onToggle, onSaved }: { goal: Goal; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; expanded: boolean; onToggle: () => void; onSaved: () => void }) {
  const initial = goal.checkIn;
  const [actualValue, setActualValue] = useState<string>(initial?.actualValue !== null && initial?.actualValue !== undefined ? String(initial.actualValue) : '');
  const [actualDate, setActualDate] = useState<string>(initial?.actualDate ? new Date(initial.actualDate).toISOString().slice(0, 10) : '');
  const [status, setStatus] = useState<'NOT_STARTED' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED'>((initial?.status as any) ?? 'NOT_STARTED');
  const [comment, setComment] = useState(initial?.selfComment ?? '');
  const [saving, setSaving] = useState(false);

  // Live score preview
  const livePreviewScore = computeScore({
    uomType: goal.uomType as UomType,
    target: goal.target,
    actualValue: actualValue === '' ? null : Number(actualValue),
    targetDate: goal.targetDate,
    actualDate: actualDate || null,
  });

  const tone = scoreTone(livePreviewScore);

  async function save() {
    setSaving(true);
    const r = await saveCheckIn({
      goalId: goal.id,
      quarter,
      actualValue: actualValue === '' ? null : Number(actualValue),
      actualDate: actualDate || null,
      status,
      selfComment: comment,
    });
    setSaving(false);
    if (r.ok) {
      toast.success(quarter + ' check-in saved', { description: 'Computed score: ' + Math.round(livePreviewScore) });
      onSaved();
    } else {
      toast.error(r.error);
    }
  }

  const StatusIcon = statusOptions.find((s) => s.value === status)?.icon ?? Circle;
  const isZero = goal.uomType === 'ZERO_BASED';
  const isTimeline = goal.uomType === 'TIMELINE';

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <Card>
        <CardContent className="p-0">
          <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{goal.title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="border-none" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>{goal.thrustArea.name}</Badge>
                <span>{UOM_LABELS[goal.uomType]}</span>
                {goal.target !== null && !isTimeline && <span>· target {goal.target}{goal.uomUnit ? ' ' + goal.uomUnit : ''}</span>}
                {goal.targetDate && <span>· by {formatDate(goal.targetDate)}</span>}
                <span>· {goal.weightage}% weightage</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreGauge score={initial?.computedScore ?? livePreviewScore} size={56} strokeWidth={6} showLabel={false} />
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <StatusIcon className={cn('h-3.5 w-3.5', statusOptions.find((s) => s.value === status)?.tone)} />
                {statusOptions.find((s) => s.value === status)?.label}
              </div>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>

          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/40 px-4 pt-5 pb-5 space-y-5">
              <div className="grid lg:grid-cols-[1fr_220px] gap-6">
                {/* Left: form */}
                <div className="space-y-4">
                  {goal.description && (
                    <div className="text-xs text-muted-foreground italic">{goal.description}</div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Actual achievement {goal.uomUnit && <span className="text-xs text-muted-foreground">({goal.uomUnit})</span>}</Label>
                      {isZero ? (
                        <div className="flex gap-2">
                          <Button type="button" variant={actualValue === '0' ? 'default' : 'outline'} size="sm" onClick={() => setActualValue('0')} className="flex-1 gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Zero (success)
                          </Button>
                          <Button type="button" variant={actualValue !== '0' && actualValue !== '' ? 'default' : 'outline'} size="sm" onClick={() => setActualValue('1')} className="flex-1 gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> Non-zero
                          </Button>
                        </div>
                      ) : isTimeline ? (
                        <Input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} />
                      ) : (
                        <Input
                          type="number"
                          step="any"
                          value={actualValue}
                          onChange={(e) => setActualValue(e.target.value)}
                          placeholder={goal.target ? 'Target: ' + goal.target : 'Enter actual'}
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <div className="grid grid-cols-4 gap-1">
                        {statusOptions.map((s) => {
                          const SI = s.icon;
                          const active = status === s.value;
                          return (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setStatus(s.value as any)}
                              className={cn(
                                'flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-[10px] uppercase tracking-wide font-semibold transition-all',
                                active ? 'border-current bg-current/10 ' + s.tone : 'border-border/40 text-muted-foreground hover:border-border'
                              )}
                              title={s.label}
                            >
                              <SI className="h-4 w-4" />
                              {s.label.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Self comment <span className="text-xs text-muted-foreground font-normal">(optional, visible to your manager)</span></Label>
                    <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Context, blockers, support needed…" />
                  </div>

                  {initial?.managerComment && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">Manager check-in comment</div>
                      <p className="text-sm">{initial.managerComment}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="gradient" onClick={save} disabled={saving} className="gap-1.5">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save check-in
                    </Button>
                  </div>
                </div>

                {/* Right: live score */}
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-widest text-atom-400 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Live score preview
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <ScoreGauge score={livePreviewScore} size={120} strokeWidth={10} />
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Type</span> <span className="text-foreground font-medium">{UOM_LABELS[goal.uomType]}</span></div>
                    {goal.target !== null && !isTimeline && <div className="flex justify-between"><span>Target</span> <span className="text-foreground font-medium">{goal.target}{goal.uomUnit ? ' ' + goal.uomUnit : ''}</span></div>}
                    {isTimeline && goal.targetDate && <div className="flex justify-between"><span>Target date</span> <span className="text-foreground font-medium">{formatDate(goal.targetDate)}</span></div>}
                    <div className="flex justify-between"><span>Weightage</span> <span className="text-foreground font-medium">{goal.weightage}%</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}