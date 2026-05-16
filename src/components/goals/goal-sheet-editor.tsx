'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Trash2, Target, Calendar, Hash, Percent, Ban, ArrowDownRight, ArrowUpRight,
  Save, Send, Loader2, Sparkles, Info, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeightageVisualizer } from './weightage-visualizer';
import { saveDraftSheet, submitGoalSheet, deleteDraftGoal } from '@/lib/actions/goals';
import { cn, UOM_LABELS } from '@/lib/utils';
import type { GoalInput } from '@/lib/validators';
import type { LucideIcon } from 'lucide-react';

type ThrustArea = { id: string; name: string; color: string; description: string | null };
type ExistingGoal = {
  id: string;
  title: string;
  description: string | null;
  thrustAreaId: string;
  uomType: string;
  uomUnit: string | null;
  target: number | null;
  targetDate: Date | null;
  weightage: number;
  status: string;
};

const emptyGoal = (): GoalInput => ({
  title: '',
  description: '',
  thrustAreaId: '',
  uomType: 'NUMERIC_MIN',
  uomUnit: '',
  target: null,
  targetDate: null,
  weightage: 10,
});

const uomIcons: Record<string, LucideIcon> = {
  NUMERIC_MIN: ArrowUpRight,
  NUMERIC_MAX: ArrowDownRight,
  PERCENTAGE_MIN: Percent,
  PERCENTAGE_MAX: Percent,
  TIMELINE: Calendar,
  ZERO_BASED: Ban,
};

export function GoalSheetEditor({
  thrustAreas,
  existingDraft,
  isLocked,
}: {
  thrustAreas: ThrustArea[];
  existingDraft: ExistingGoal[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const [goals, setGoals] = useState<GoalInput[]>(() => {
    if (existingDraft.length > 0) {
      return existingDraft.map((g) => ({
        title: g.title,
        description: g.description ?? '',
        thrustAreaId: g.thrustAreaId,
        uomType: g.uomType as GoalInput['uomType'],
        uomUnit: g.uomUnit ?? '',
        target: g.target ?? null,
        targetDate: g.targetDate ? new Date(g.targetDate).toISOString().slice(0, 10) : null,
        weightage: g.weightage,
      }));
    }
    return [emptyGoal()];
  });

  const totalWeight = useMemo(() => goals.reduce((s, g) => s + (Number(g.weightage) || 0), 0), [goals]);
  const isBalanced = Math.abs(totalWeight - 100) < 0.01;

  // Autosave (debounced ~1.5s after last edit)
  useEffect(() => {
    if (isLocked) return;
    if (goals.length === 0) return;
    if (goals.every((g) => !g.title && !g.thrustAreaId)) return;
    const t = setTimeout(() => {
      startTransition(async () => {
        const result = await saveDraftSheet(goals);
        if (!result.ok) console.warn('Autosave failed:', result.error);
      });
    }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(goals), isLocked]);

  function updateGoal(idx: number, patch: Partial<GoalInput>) {
    setGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function addGoal() {
    if (goals.length >= 8) {
      toast.error('Maximum 8 goals per sheet');
      return;
    }
    const remaining = Math.max(10, 100 - totalWeight);
    setGoals((prev) => [...prev, { ...emptyGoal(), weightage: Math.min(remaining, 25) }]);
    setExpandedIdx(goals.length);
  }

  async function removeGoal(idx: number) {
    const goal = existingDraft[idx];
    if (goal && goal.id) {
      const r = await deleteDraftGoal(goal.id);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
    }
    setGoals((prev) => prev.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    toast.success('Goal removed');
  }

  async function handleSaveDraft() {
    const r = await saveDraftSheet(goals);
    if (r.ok) toast.success('Draft saved');
    else toast.error(r.error);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const r = await submitGoalSheet(goals);
    setSubmitting(false);
    if (r.ok) {
      toast.success('Goal sheet submitted for approval', { description: 'Your manager has been notified.' });
      router.push('/dashboard/goals');
      router.refresh();
    } else {
      toast.error('Submission failed', { description: r.error });
    }
  }

  // Slices for the visualizer
  const slices = goals.map((g) => {
    const ta = thrustAreas.find((t) => t.id === g.thrustAreaId);
    return {
      weightage: Number(g.weightage) || 0,
      color: ta?.color ?? '#71717a',
      label: g.title || 'Untitled',
    };
  }).filter((s) => s.weightage > 0);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* LEFT — goal list */}
      <div className="space-y-4">
        {/* Summary header */}
        <Card>
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Goal Sheet</div>
              <div className="font-display text-2xl font-bold tracking-tight mt-0.5">
                {goals.length}<span className="text-muted-foreground">/8</span> goals · <span className={cn(isBalanced ? 'text-emerald-400' : 'text-muted-foreground')}>{totalWeight.toFixed(0)}%</span> allocated
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pending && <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isLocked} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save draft
              </Button>
              <Button variant="gradient" size="sm" onClick={handleSubmit} disabled={!isBalanced || goals.length === 0 || submitting || isLocked} className="gap-1.5">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hint banner */}
        {!isBalanced && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
            <Info className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Weightage must equal 100% to submit</div>
              <div className="text-muted-foreground text-xs mt-0.5">Currently at <b>{totalWeight.toFixed(0)}%</b>. Min 10% per goal, max 8 goals.</div>
            </div>
          </div>
        )}

        {/* Goal rows */}
        <AnimatePresence initial={false}>
          {goals.map((goal, idx) => {
            const ta = thrustAreas.find((t) => t.id === goal.thrustAreaId);
            const Icon = uomIcons[goal.uomType] ?? Target;
            const expanded = expandedIdx === idx;

            return (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              >
                <Card>
                  <CardContent className="p-0">
                    {/* HEADER ROW */}
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(expanded ? null : idx)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: (ta?.color ?? '#71717a') + '20', color: ta?.color ?? '#71717a' }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{goal.title || <span className="text-muted-foreground italic">Untitled goal</span>}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {ta && <Badge variant="outline" className="border-none" style={{ background: ta.color + '20', color: ta.color }}>{ta.name}</Badge>}
                          <span>{UOM_LABELS[goal.uomType]}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-display text-xl font-bold tracking-tight">{Number(goal.weightage).toFixed(0)}<span className="text-sm text-muted-foreground">%</span></div>
                      </div>
                      {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {/* EXPANDED BODY */}
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/40 px-4 pt-4 pb-5 space-y-4"
                      >
                        {/* Title + Thrust Area */}
                        <div className="grid sm:grid-cols-[1fr_220px] gap-3">
                          <div className="space-y-1.5">
                            <Label>Goal title</Label>
                            <Input value={goal.title} onChange={(e) => updateGoal(idx, { title: e.target.value })} placeholder="e.g. Ship Smart Fan v3 firmware" disabled={isLocked} />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Thrust area</Label>
                            <Select value={goal.thrustAreaId} onValueChange={(v) => updateGoal(idx, { thrustAreaId: v })} disabled={isLocked}>
                              <SelectTrigger><SelectValue placeholder="Pick area" /></SelectTrigger>
                              <SelectContent>
                                {thrustAreas.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    <span className="flex items-center gap-2">
                                      <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                                      {t.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                          <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                          <Textarea rows={2} value={goal.description ?? ''} onChange={(e) => updateGoal(idx, { description: e.target.value })} placeholder="What does success look like?" disabled={isLocked} />
                        </div>

                        {/* UoM + Target */}
                        <div className="grid sm:grid-cols-[200px_1fr_140px] gap-3">
                          <div className="space-y-1.5">
                            <Label>Measurement type</Label>
                            <Select value={goal.uomType} onValueChange={(v) => updateGoal(idx, { uomType: v as GoalInput['uomType'] })} disabled={isLocked}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NUMERIC_MIN">📈 Numeric — higher better</SelectItem>
                                <SelectItem value="NUMERIC_MAX">📉 Numeric — lower better</SelectItem>
                                <SelectItem value="PERCENTAGE_MIN">% — higher better</SelectItem>
                                <SelectItem value="PERCENTAGE_MAX">% — lower better</SelectItem>
                                <SelectItem value="TIMELINE">📅 Timeline (date)</SelectItem>
                                <SelectItem value="ZERO_BASED">🎯 Zero-based (0 = success)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Target</Label>
                            {goal.uomType === 'TIMELINE' ? (
                              <Input type="date" value={goal.targetDate ?? ''} onChange={(e) => updateGoal(idx, { targetDate: e.target.value })} disabled={isLocked} />
                            ) : goal.uomType === 'ZERO_BASED' ? (
                              <Input value="0" disabled className="text-muted-foreground" />
                            ) : (
                              <Input
                                type="number"
                                step="any"
                                value={goal.target ?? ''}
                                onChange={(e) => updateGoal(idx, { target: e.target.value === '' ? null : Number(e.target.value) })}
                                placeholder={goal.uomType.includes('PERCENTAGE') ? 'e.g. 70' : 'e.g. 1000'}
                                disabled={isLocked}
                              />
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label>Unit</Label>
                            <Input value={goal.uomUnit ?? ''} onChange={(e) => updateGoal(idx, { uomUnit: e.target.value })} placeholder={goal.uomType.includes('PERCENTAGE') ? '%' : goal.uomType === 'ZERO_BASED' ? 'incidents' : 'units'} disabled={isLocked} />
                          </div>
                        </div>

                        {/* Weightage slider */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Weightage</Label>
                            <span className="text-sm text-muted-foreground">Min 10% · Max 100%</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={10}
                              max={100}
                              step={5}
                              value={Number(goal.weightage)}
                              onChange={(e) => updateGoal(idx, { weightage: Number(e.target.value) })}
                              disabled={isLocked}
                              className="flex-1 accent-atom-500"
                              style={{ background: `linear-gradient(to right, ${ta?.color ?? '#6366f1'} ${goal.weightage}%, hsl(var(--muted)) ${goal.weightage}%)` }}
                            />
                            <div className="w-20 flex-shrink-0">
                              <Input
                                type="number"
                                min={10}
                                max={100}
                                value={Number(goal.weightage)}
                                onChange={(e) => updateGoal(idx, { weightage: Math.max(10, Math.min(100, Number(e.target.value) || 0)) })}
                                disabled={isLocked}
                                className="text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Remove */}
                        <div className="flex justify-end pt-1">
                          <Button variant="ghost" size="sm" onClick={() => removeGoal(idx)} disabled={isLocked} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" /> Remove goal
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add goal button */}
        {goals.length < 8 && (
          <button
            type="button"
            onClick={addGoal}
            disabled={isLocked}
            className="w-full rounded-xl border-2 border-dashed border-border/60 hover:border-atom-500/50 hover:bg-atom-500/5 transition-all p-6 flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="h-10 w-10 rounded-lg bg-atom-500/10 flex items-center justify-center group-hover:bg-atom-500/20 transition-colors">
              <Plus className="h-5 w-5 text-atom-400" />
            </div>
            <div className="text-sm font-medium">Add another goal</div>
            <div className="text-xs text-muted-foreground">{8 - goals.length} slots remaining · {(100 - totalWeight).toFixed(0)}% weightage left</div>
          </button>
        )}
      </div>

      {/* RIGHT — visualizer panel (sticky) */}
      <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
              <Sparkles className="h-3 w-3" /> Live allocation
            </div>
            <WeightageVisualizer slices={slices} />
            <div className="mt-4 w-full space-y-1.5 text-left">
              {slices.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">Start adding goals to see distribution.</div>
              )}
              {goals.map((g, i) => {
                const ta = thrustAreas.find((t) => t.id === g.thrustAreaId);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: ta?.color ?? '#71717a' }} />
                    <span className="flex-1 truncate text-muted-foreground">{g.title || `Goal ${i + 1}`}</span>
                    <span className="font-mono font-medium">{Number(g.weightage).toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-xs space-y-2">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Rules</div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" /> Total weightage must equal <b className="text-foreground">100%</b>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" /> Minimum <b className="text-foreground">10%</b> per goal
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" /> Maximum <b className="text-foreground">8 goals</b> per sheet
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" /> Goals lock on manager approval
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
