'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Edit3, Trash2, Save, Loader2, Power, AlertTriangle, CheckCircle2, Zap, X, Bell
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveRule, toggleRule, deleteRule, resolveEscalation } from '@/lib/actions/escalations';
import { cn, initials, formatDate } from '@/lib/utils';

type Rule = {
  id: string;
  name: string;
  description: string | null;
  triggerEvent: string;
  thresholdDays: number;
  escalateTo: string;
  isActive: boolean;
};

type Escalation = {
  id: string;
  ruleName: string;
  ruleEvent: string;
  targetName: string;
  targetEmail: string;
  reason: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
};

const EVENT_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: 'Goal submission overdue',
  APPROVAL_PENDING: 'Manager approval pending',
  CHECKIN_OVERDUE: 'Quarterly check-in overdue',
};

const ESCALATE_LABELS: Record<string, string> = {
  MANAGER: 'Notify Manager',
  SKIP_LEVEL: 'Notify Skip-level',
  HR: 'Notify HR / Admin',
};

export function EscalationManager({ rules, escalations }: { rules: Rule[]; escalations: Escalation[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);

  async function runScan() {
    setRunning(true);
    try {
      const res = await fetch('/api/escalations/run', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Scan complete · ' + json.data.created + ' new escalation(s)', {
          description: 'Evaluated ' + json.data.rulesEvaluated + ' active rule(s).',
        });
        router.refresh();
      } else toast.error(json.error);
    } catch (e: any) {
      toast.error('Scan failed: ' + e.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleToggle(id: string, val: boolean) {
    const r = await toggleRule(id, val);
    if (r.ok) { toast.success(val ? 'Rule activated' : 'Rule paused'); router.refresh(); }
    else toast.error(r.error);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this rule? Existing escalations are preserved.')) return;
    const r = await deleteRule(id);
    if (r.ok) { toast.success('Deleted'); router.refresh(); }
    else toast.error(r.error);
  }

  async function handleResolve(id: string) {
    const r = await resolveEscalation(id);
    if (r.ok) { toast.success('Marked resolved'); router.refresh(); }
    else toast.error(r.error);
  }

  const openEscalations = escalations.filter((e) => !e.isResolved);
  const resolvedEscalations = escalations.filter((e) => e.isResolved);

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <Card>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-atom-400 font-semibold flex items-center gap-1.5"><Zap className="h-3 w-3" /> Rule engine</div>
            <div className="font-display text-lg font-bold mt-1">{rules.filter((r) => r.isActive).length} active · {rules.length} total · {openEscalations.length} open escalations</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setCreating(true); setEditingId(null); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> New rule
            </Button>
            <Button variant="gradient" onClick={runScan} disabled={running} className="gap-1.5">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {running ? 'Scanning…' : 'Run scan now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Open escalations */}
      {openEscalations.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-widest font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Open escalations · {openEscalations.length}
          </div>
          {openEscalations.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {initials(e.targetName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {e.targetName}
                    <Badge variant="destructive" className="text-[10px] py-0">{EVENT_LABELS[e.ruleEvent] ?? e.ruleEvent}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{e.reason}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Raised {new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {e.ruleName}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleResolve(e.id)} className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rules */}
      <div className="space-y-3">
        <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Rules
        </div>

        <AnimatePresence>
          {creating && <RuleEditor key="new" rule={null} onCancel={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
        </AnimatePresence>

        {rules.map((r) => (
          <div key={r.id}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <button
                  onClick={() => handleToggle(r.id, !r.isActive)}
                  className={cn('h-10 w-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                    r.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50')}
                  title={r.isActive ? 'Active — click to pause' : 'Paused — click to activate'}
                >
                  <Power className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {r.name}
                    {!r.isActive && <Badge variant="outline" className="text-[10px] py-0">Paused</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>{EVENT_LABELS[r.triggerEvent] ?? r.triggerEvent}</span>
                    <span> · after {r.thresholdDays} days</span>
                    <span> · {ESCALATE_LABELS[r.escalateTo] ?? r.escalateTo}</span>
                  </div>
                  {r.description && <div className="text-[11px] text-muted-foreground/80 italic mt-0.5">{r.description}</div>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(editingId === r.id ? null : r.id); setCreating(false); }} className="gap-1.5">
                  {editingId === r.id ? <X className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                  {editingId === r.id ? 'Close' : 'Edit'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
            <AnimatePresence>
              {editingId === r.id && (
                <div className="mt-2"><RuleEditor rule={r} onCancel={() => setEditingId(null)} onSaved={() => { setEditingId(null); router.refresh(); }} /></div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Resolved log */}
      {resolvedEscalations.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground">Resolved · {resolvedEscalations.length}</summary>
          <div className="space-y-2 mt-2">
            {resolvedEscalations.slice(0, 20).map((e) => (
              <div key={e.id} className="rounded-lg border border-border/30 bg-muted/10 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span><b>{e.targetName}</b> · {e.ruleName}</span>
                  <span className="text-muted-foreground">Resolved {e.resolvedAt ? formatDate(e.resolvedAt) : ''}</span>
                </div>
                <div className="text-muted-foreground mt-0.5">{e.reason}</div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function RuleEditor({ rule, onCancel, onSaved }: { rule: Rule | null; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: rule?.name ?? '',
    description: rule?.description ?? '',
    triggerEvent: (rule?.triggerEvent as any) ?? 'GOAL_NOT_SUBMITTED',
    thresholdDays: rule?.thresholdDays ?? 7,
    escalateTo: (rule?.escalateTo as any) ?? 'MANAGER',
    isActive: rule?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await saveRule({ id: rule?.id, ...form });
    setSaving(false);
    if (r.ok) { toast.success(rule ? 'Rule updated' : 'Rule created'); onSaved(); }
    else toast.error(r.error);
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
      <Card className="border-atom-500/30 bg-atom-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rule name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Goal submission overdue" />
            </div>
            <div className="space-y-1.5">
              <Label>Trigger event</Label>
              <Select value={form.triggerEvent} onValueChange={(v) => setForm({ ...form, triggerEvent: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOAL_NOT_SUBMITTED">Goal not submitted</SelectItem>
                  <SelectItem value="APPROVAL_PENDING">Manager approval pending</SelectItem>
                  <SelectItem value="CHECKIN_OVERDUE">Quarterly check-in overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Threshold (days)</Label>
              <Input type="number" min={1} max={90} value={form.thresholdDays} onChange={(e) => setForm({ ...form, thresholdDays: Number(e.target.value) || 1 })} />
            </div>
            <div className="space-y-1.5">
              <Label>Escalate to</Label>
              <Select value={form.escalateTo} onValueChange={(v) => setForm({ ...form, escalateTo: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="SKIP_LEVEL">Skip-level</SelectItem>
                  <SelectItem value="HR">HR / Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this rule does and why." />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={save} disabled={saving || !form.name} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save rule
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}