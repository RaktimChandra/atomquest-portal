'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Check, X, MessageSquareWarning, Lock, Save, Loader2, Target, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Clock, FileText, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WeightageVisualizer } from '@/components/goals/weightage-visualizer';
import { editSubmittedGoal, approveEmployeeSheet, returnEmployeeSheet } from '@/lib/actions/approvals';
import { cn, STATUS_COLORS, UOM_LABELS, formatDate } from '@/lib/utils';

type Goal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  thrustArea: { name: string; color: string };
  uomType: string;
  uomUnit: string | null;
  target: number | null;
  targetDate: string | null;
  weightage: number;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
};

export function ApprovalDetail({ employeeId, employeeName, goals: initialGoals }: { employeeId: string; employeeName: string; goals: Goal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState(initialGoals);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [_, startTransition] = useTransition();

  const submitted = goals.filter((g) => g.status === 'SUBMITTED');
  const approved = goals.filter((g) => g.status === 'APPROVED' || g.status === 'LOCKED');
  const returned = goals.filter((g) => g.status === 'RETURNED');

  const totalSubmittedWeight = submitted.reduce((s, g) => s + g.weightage, 0);
  const isBalanced = Math.abs(totalSubmittedWeight - 100) < 0.01;
  const hasPending = submitted.length > 0;

  const slices = submitted.map((g) => ({
    weightage: g.weightage,
    color: g.thrustArea.color,
    label: g.title,
  }));

  async function handleFieldSave(goalId: string, patch: { title?: string; target?: number | null; targetDate?: string | null; weightage?: number }) {
    setSavingId(goalId);
    const r = await editSubmittedGoal({ goalId, ...patch });
    setSavingId(null);
    if (r.ok) {
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...patch } : g)));
      toast.success('Saved');
    } else toast.error(r.error);
  }

  async function handleApprove() {
    if (!isBalanced) {
      toast.error('Weightage must equal 100% before approval', { description: `Currently at ${totalSubmittedWeight.toFixed(0)}%` });
      return;
    }
    setSubmitting(true);
    const r = await approveEmployeeSheet(employeeId);
    setSubmitting(false);
    if (r.ok) {
      toast.success(`Approved ${submitted.length} goals for ${employeeName}`, { description: 'Goals are now locked. Employee notified.' });
      router.refresh();
    } else toast.error(r.error);
  }

  async function handleReturn() {
    if (returnReason.trim().length < 5) {
      toast.error('Please write a meaningful reason (min 5 chars)');
      return;
    }
    setSubmitting(true);
    const r = await returnEmployeeSheet(employeeId, returnReason);
    setSubmitting(false);
    setReturnDialogOpen(false);
    if (r.ok) {
      toast.success('Sheet returned for rework', { description: 'Employee notified with your reason.' });
      setReturnReason('');
      router.refresh();
    } else toast.error(r.error);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-4">
        {/* Action bar */}
        {hasPending && (
          <Card>
            <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Pending your review
                </div>
                <div className="font-display text-xl font-bold tracking-tight mt-0.5">
                  {submitted.length} goal{submitted.length !== 1 ? 's' : ''} · <span className={cn(isBalanced ? 'text-emerald-400' : 'text-amber-400')}>{totalSubmittedWeight.toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setReturnDialogOpen(true)} disabled={submitting} className="gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                  <MessageSquareWarning className="h-4 w-4" /> Return for rework
                </Button>
                <Button variant="gradient" onClick={handleApprove} disabled={!isBalanced || submitting} className="gap-1.5">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {submitting ? 'Approving…' : 'Approve & lock'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isBalanced && hasPending && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Cannot approve — weightage off</div>
              <div className="text-muted-foreground text-xs mt-0.5">Adjust the weightages below so they total exactly 100%, or return for rework.</div>
            </div>
          </div>
        )}

        {/* Submitted goals (editable) */}
        {hasPending && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Submitted for approval</div>
            <AnimatePresence>
              {submitted.map((g) => {
                const expanded = expandedId === g.id;
                return (
                  <motion.div key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card>
                      <CardContent className="p-0">
                        <button type="button" onClick={() => setExpandedId(expanded ? null : g.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/30 transition-colors">
                          <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: g.thrustArea.color + '20', color: g.thrustArea.color }}>
                            <Target className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{g.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="border-none" style={{ background: g.thrustArea.color + '20', color: g.thrustArea.color }}>{g.thrustArea.name}</Badge>
                              <span>{UOM_LABELS[g.uomType]}</span>
                              {g.target !== null && <span>· target {g.target}{g.uomUnit ? ' ' + g.uomUnit : ''}</span>}
                              {g.targetDate && <span>· by {formatDate(g.targetDate)}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display text-xl font-bold tracking-tight">{g.weightage.toFixed(0)}<span className="text-sm text-muted-foreground">%</span></div>
                          </div>
                          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </button>

                        {expanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/40 px-4 pt-4 pb-5 space-y-4">
                            {g.description && (
                              <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Description</div>
                                <p className="text-sm leading-relaxed">{g.description}</p>
                              </div>
                            )}

                            <div className="grid sm:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label>Title</Label>
                                <Input defaultValue={g.title} onBlur={(e) => e.target.value !== g.title && handleFieldSave(g.id, { title: e.target.value })} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Target {g.uomUnit && <span className="text-xs text-muted-foreground">({g.uomUnit})</span>}</Label>
                                {g.uomType === 'TIMELINE' ? (
                                  <Input type="date" defaultValue={g.targetDate?.slice(0, 10) ?? ''} onBlur={(e) => handleFieldSave(g.id, { targetDate: e.target.value || null })} />
                                ) : g.uomType === 'ZERO_BASED' ? (
                                  <Input value="0" disabled />
                                ) : (
                                  <Input type="number" step="any" defaultValue={g.target ?? ''} onBlur={(e) => {
                                    const v = e.target.value === '' ? null : Number(e.target.value);
                                    if (v !== g.target) handleFieldSave(g.id, { target: v });
                                  }} />
                                )}
                              </div>
                              <div className="space-y-1.5">
                                <Label>Weightage (%)</Label>
                                <Input type="number" min={10} max={100} defaultValue={g.weightage} onBlur={(e) => {
                                  const v = Math.max(10, Math.min(100, Number(e.target.value) || 0));
                                  if (v !== g.weightage) handleFieldSave(g.id, { weightage: v });
                                }} />
                              </div>
                            </div>

                            {savingId === g.id && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin" /> Saving inline edit…
                              </div>
                            )}
                            <div className="text-[11px] text-muted-foreground italic">💡 Edit any field — changes save when you click out of the input. All changes audit-logged.</div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Other states */}
        {approved.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Approved & locked
            </div>
            {approved.map((g) => (
              <Card key={g.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: g.thrustArea.color + '20', color: g.thrustArea.color }}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{g.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Approved {g.approvedAt && formatDate(g.approvedAt)}</div>
                  </div>
                  <div className="font-display text-xl font-bold">{g.weightage.toFixed(0)}<span className="text-sm text-muted-foreground">%</span></div>
                  <Badge className={cn('border', STATUS_COLORS[g.status])} variant="outline">{g.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {returned.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-rose-400 font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" /> Previously returned
            </div>
            {returned.map((g) => (
              <Card key={g.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: g.thrustArea.color + '20', color: g.thrustArea.color }}>
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{g.title}</div>
                    </div>
                    <Badge className={cn('border', STATUS_COLORS[g.status])} variant="outline">RETURNED</Badge>
                  </div>
                  {g.rejectionReason && (
                    <div className="text-xs italic text-muted-foreground bg-rose-500/5 border border-rose-500/10 rounded p-2">"{g.rejectionReason}"</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!hasPending && approved.length === 0 && returned.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display text-lg font-semibold mb-1">No goal sheet yet</h3>
              <p className="text-sm text-muted-foreground">This employee hasn't submitted a goal sheet for the current cycle.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right rail */}
      <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
        {hasPending && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400 mb-1">
                Allocation
              </div>
              <WeightageVisualizer slices={slices} size={200} strokeWidth={22} />
              <div className="mt-3 w-full space-y-1.5 text-left">
                {submitted.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: g.thrustArea.color }} />
                    <span className="flex-1 truncate text-muted-foreground">{g.title}</span>
                    <span className="font-mono font-medium">{g.weightage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </aside>

      {/* Return dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for rework</DialogTitle>
            <DialogDescription>Tell {employeeName} what needs to change. This message will be shown on their goal sheet and sent as a notification.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" rows={4} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="e.g. The customer-experience goal needs a measurable target — please add an NPS or CSAT number." />
            <div className="text-xs text-muted-foreground">{returnReason.length}/500 characters</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReturn} disabled={returnReason.trim().length < 5 || submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareWarning className="h-4 w-4" />}
              Send return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}