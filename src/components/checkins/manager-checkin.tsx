'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Target, MessageSquare, Save, Loader2, Star, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScoreGauge } from './score-gauge';
import { saveManagerCheckIn } from '@/lib/actions/checkins';
import { cn, UOM_LABELS, formatDate } from '@/lib/utils';

type CheckIn = {
  id: string;
  quarter: string;
  actualValue: number | null;
  actualDate: string | null;
  status: string;
  computedScore: number | null;
  selfComment: string | null;
  managerComment: string | null;
  managerRating: number | null;
};

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
  checkIns: CheckIn[];
};

export function ManagerCheckInView({ employeeName, quarter, goals }: { employeeName: string; quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; goals: Goal[] }) {
  return (
    <div className="space-y-3">
      {goals.map((g) => (
        <ManagerGoalRow key={g.id} goal={g} quarter={quarter} />
      ))}
    </div>
  );
}

function ManagerGoalRow({ goal, quarter }: { goal: Goal; quarter: string }) {
  const router = useRouter();
  const ci = goal.checkIns.find((c) => c.quarter === quarter);
  const [comment, setComment] = useState(ci?.managerComment ?? '');
  const [rating, setRating] = useState<number | null>(ci?.managerRating ?? null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!ci) {
      toast.error('Employee has not checked in for this quarter yet');
      return;
    }
    if (comment.trim().length < 5) {
      toast.error('Comment must be at least 5 characters');
      return;
    }
    setSaving(true);
    const r = await saveManagerCheckIn({ checkInId: ci.id, comment, rating: rating ?? undefined });
    setSaving(false);
    if (r.ok) {
      toast.success('Check-in comment saved');
      router.refresh();
    } else toast.error(r.error);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{goal.title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="border-none" style={{ background: goal.thrustArea.color + '20', color: goal.thrustArea.color }}>{goal.thrustArea.name}</Badge>
                <span>{UOM_LABELS[goal.uomType]}</span>
                <span>· {goal.weightage}% weightage</span>
              </div>
            </div>
            <ScoreGauge score={ci?.computedScore ?? 0} size={60} strokeWidth={6} showLabel={false} />
          </div>

          {/* Planned vs Achievement */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Planned</div>
              <div className="text-sm">
                {goal.uomType === 'TIMELINE'
                  ? <>Complete by <b>{formatDate(goal.targetDate)}</b></>
                  : goal.uomType === 'ZERO_BASED'
                  ? <>Maintain <b>0 incidents</b></>
                  : <>Target <b>{goal.target ?? '—'}</b>{goal.uomUnit && ' ' + goal.uomUnit}</>}
              </div>
            </div>
            <div className="rounded-lg border border-atom-500/30 bg-atom-500/5 p-3">
              <div className="text-[10px] uppercase tracking-widest text-atom-400 font-semibold mb-1.5">Achievement</div>
              <div className="text-sm">
                {!ci
                  ? <span className="italic text-muted-foreground">Not checked in yet</span>
                  : goal.uomType === 'TIMELINE'
                  ? <>Completed on <b>{ci.actualDate ? formatDate(ci.actualDate) : '—'}</b></>
                  : <>Actual <b>{ci.actualValue ?? '—'}</b>{goal.uomUnit && ' ' + goal.uomUnit}</>}
                {ci && <span className="ml-2 text-xs text-muted-foreground">· status {ci.status}</span>}
              </div>
            </div>
          </div>

          {/* Self comment */}
          {ci?.selfComment && (
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Employee comment</div>
              <p className="text-sm italic">"{ci.selfComment}"</p>
            </div>
          )}

          {/* Manager comment form */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <Label className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Your check-in comment</Label>
            <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Document the discussion, blockers raised, agreed next steps…" disabled={!ci} />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">Optional rating:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? null : n)}
                    className={cn('p-1 transition-colors', rating !== null && n <= rating ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-muted-foreground')}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                ))}
              </div>
              <Button variant="gradient" size="sm" onClick={save} disabled={saving || !ci} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}