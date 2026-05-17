'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Share2, Send, Loader2, Users, Target, Crown, Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSharedGoal } from '@/lib/actions/shared';
import { cn, initials } from '@/lib/utils';

type ThrustArea = { id: string; name: string; color: string };
type Candidate = { id: string; name: string; email: string; designation: string | null; department: string | null; role: string };

export function ShareGoalForm({ thrustAreas, candidates }: { thrustAreas: ThrustArea[]; candidates: Candidate[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thrustAreaId, setThrustAreaId] = useState('');
  const [uomType, setUomType] = useState<'NUMERIC_MIN' | 'NUMERIC_MAX' | 'PERCENTAGE_MIN' | 'PERCENTAGE_MAX' | 'TIMELINE' | 'ZERO_BASED'>('NUMERIC_MIN');
  const [uomUnit, setUomUnit] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [weightage, setWeightage] = useState('20');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [primaryOwnerId, setPrimaryOwnerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTimeline = uomType === 'TIMELINE';
  const isZero = uomType === 'ZERO_BASED';
  const canSubmit = title.length >= 3 && thrustAreaId && recipientIds.length > 0 && primaryOwnerId && recipientIds.includes(primaryOwnerId);

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!next.includes(primaryOwnerId)) setPrimaryOwnerId(next[0] ?? '');
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    const r = await createSharedGoal({
      title,
      description,
      thrustAreaId,
      uomType,
      uomUnit,
      target: isTimeline || isZero ? null : (target === '' ? null : Number(target)),
      targetDate: isTimeline ? (targetDate || null) : null,
      defaultWeightage: Number(weightage) || 20,
      recipientIds,
      primaryOwnerId,
    });
    setSubmitting(false);
    if (r.ok) {
      toast.success('Shared goal created', { description: 'Recipients notified. Each can adjust weightage in their goal sheet.' });
      router.push('/dashboard/team');
      router.refresh();
    } else toast.error(r.error);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      {/* LEFT: Goal definition */}
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-widest text-atom-400 flex items-center gap-1.5"><Target className="h-3 w-3" /> Goal definition</div>

            <div className="space-y-1.5">
              <Label>Goal title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Achieve department NPS above 70" />
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Thrust area</Label>
                <Select value={thrustAreaId} onValueChange={setThrustAreaId}>
                  <SelectTrigger><SelectValue placeholder="Pick area" /></SelectTrigger>
                  <SelectContent>
                    {thrustAreas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: t.color }} />{t.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Measurement type</Label>
                <Select value={uomType} onValueChange={(v) => setUomType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUMERIC_MIN">📈 Numeric — higher better</SelectItem>
                    <SelectItem value="NUMERIC_MAX">📉 Numeric — lower better</SelectItem>
                    <SelectItem value="PERCENTAGE_MIN">% — higher better</SelectItem>
                    <SelectItem value="PERCENTAGE_MAX">% — lower better</SelectItem>
                    <SelectItem value="TIMELINE">📅 Timeline (date)</SelectItem>
                    <SelectItem value="ZERO_BASED">🎯 Zero-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-[1fr_140px_140px] gap-3">
              <div className="space-y-1.5">
                <Label>Target</Label>
                {isTimeline ? (
                  <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                ) : isZero ? (
                  <Input value="0" disabled />
                ) : (
                  <Input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 1000" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Input value={uomUnit} onChange={(e) => setUomUnit(e.target.value)} placeholder="e.g. INR, %, days" disabled={isTimeline} />
              </div>
              <div className="space-y-1.5">
                <Label>Default weightage</Label>
                <Input type="number" min={10} max={100} value={weightage} onChange={(e) => setWeightage(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-atom-400 flex items-center gap-1.5"><Users className="h-3 w-3" /> Recipients</div>
              <Badge variant="info">{recipientIds.length} selected</Badge>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {candidates.map((c) => {
                const selected = recipientIds.includes(c.id);
                const isPrimary = primaryOwnerId === c.id;
                return (
                  <motion.div key={c.id} layout>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleRecipient(c.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRecipient(c.id); } }}
                      className={cn('w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all cursor-pointer select-none',
                        selected ? 'border-atom-500/50 bg-atom-500/10' : 'border-border/40 hover:border-border'
                      )}
                    >
                      <div className={cn('h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        selected ? 'border-atom-500 bg-atom-500' : 'border-border/60'
                      )}>
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {c.name}
                          {isPrimary && <Badge variant="warning" className="text-[10px] py-0 px-1.5"><Crown className="h-2.5 w-2.5 mr-0.5" /> Primary</Badge>}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{c.designation ?? ''} {c.department ? '· ' + c.department : ''}</div>
                      </div>
                      {selected && !isPrimary && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPrimaryOwnerId(c.id); }}
                          className="text-[10px] uppercase tracking-wide font-semibold text-atom-400 hover:text-atom-300 underline"
                        >
                          Set primary
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground italic">
              💡 The primary owner is the source of truth for achievement. When they update their check-in, all linked goals auto-inherit the actuals.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Summary + submit */}
      <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Preview</div>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Title:</span> <b>{title || '—'}</b></div>
              <div><span className="text-muted-foreground">Target:</span> <b>{isTimeline ? (targetDate || '—') : isZero ? '0' : (target || '—')}</b>{uomUnit && ' ' + uomUnit}</div>
              <div><span className="text-muted-foreground">Weightage:</span> <b>{weightage}%</b></div>
              <div><span className="text-muted-foreground">Recipients:</span> <b>{recipientIds.length}</b></div>
              <div><span className="text-muted-foreground">Primary:</span> <b>{candidates.find((c) => c.id === primaryOwnerId)?.name ?? '—'}</b></div>
            </div>

            <Button variant="gradient" className="w-full gap-1.5" disabled={!canSubmit || submitting} onClick={submit}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Share with {recipientIds.length} {recipientIds.length === 1 ? 'person' : 'people'}
            </Button>
            {!canSubmit && (
              <div className="text-[11px] text-muted-foreground">Required: title, thrust area, at least one recipient with a primary owner selected.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-xs space-y-2">
            <div className="font-semibold text-sm mb-1 flex items-center gap-1.5"><Share2 className="h-3.5 w-3.5 text-atom-400" /> How shared goals work</div>
            <div className="space-y-1.5 text-muted-foreground">
              <div>1. Goal is created with the same title/target across all recipients.</div>
              <div>2. Recipients see it pre-populated in their goal sheet.</div>
              <div>3. They can only adjust their own weightage — not title or target.</div>
              <div>4. Primary owner's check-in auto-syncs to all linked goals.</div>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}