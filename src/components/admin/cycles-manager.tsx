'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle2, Plus, Edit3, Loader2, Save, Power, Palette, Trash2, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveCycle, setActiveCycle, saveThrustArea, deleteThrustArea } from '@/lib/actions/admin';
import { cn, formatDate } from '@/lib/utils';

type ThrustArea = { id: string; name: string; description: string | null; color: string };
type Cycle = {
  id: string;
  name: string;
  fiscalYear: string;
  phase: string;
  isActive: boolean;
  goalSettingOpen: string;
  goalSettingClose: string;
  q1Open: string; q1Close: string;
  q2Open: string; q2Close: string;
  q3Open: string; q3Close: string;
  q4Open: string; q4Close: string;
  thrustAreas: ThrustArea[];
};

const PRESET_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

export function CyclesManager({ cycles }: { cycles: Cycle[] }) {
  const router = useRouter();
  const [editingCycleId, setEditingCycleId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  async function handleActivate(id: string) {
    const r = await setActiveCycle(id);
    if (r.ok) {
      toast.success('Cycle activated');
      router.refresh();
    } else toast.error(r.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="gradient" onClick={() => { setCreatingNew(true); setEditingCycleId(null); }} className="gap-1.5">
          <Plus className="h-4 w-4" /> New cycle
        </Button>
      </div>

      <AnimatePresence>
        {creatingNew && (
          <CycleEditor key="new" cycle={null} onClose={() => setCreatingNew(false)} onSaved={() => { setCreatingNew(false); router.refresh(); }} />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {cycles.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-xl font-bold tracking-tight">{c.name}</h3>
                    {c.isActive ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                    <Badge variant="info">{c.phase}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">FY {c.fiscalYear} · {c.thrustAreas.length} thrust areas</div>
                </div>
                <div className="flex items-center gap-2">
                  {!c.isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleActivate(c.id)} className="gap-1.5">
                      <Power className="h-3.5 w-3.5" /> Activate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setEditingCycleId(editingCycleId === c.id ? null : c.id); setCreatingNew(false); }} className="gap-1.5">
                    <Edit3 className="h-3.5 w-3.5" /> {editingCycleId === c.id ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </div>

              {/* Quarter windows summary */}
              <div className="grid grid-cols-5 gap-2 text-xs">
                <WindowChip label="Goal-Setting" open={c.goalSettingOpen} close={c.goalSettingClose} />
                <WindowChip label="Q1" open={c.q1Open} close={c.q1Close} />
                <WindowChip label="Q2" open={c.q2Open} close={c.q2Close} />
                <WindowChip label="Q3" open={c.q3Open} close={c.q3Close} />
                <WindowChip label="Q4" open={c.q4Open} close={c.q4Close} />
              </div>

              {/* Thrust areas */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Palette className="h-3 w-3" /> Thrust areas
                </div>
                <ThrustAreasGrid cycleId={c.id} areas={c.thrustAreas} onChanged={() => router.refresh()} />
              </div>

              <AnimatePresence>
                {editingCycleId === c.id && (
                  <CycleEditor cycle={c} onClose={() => setEditingCycleId(null)} onSaved={() => { setEditingCycleId(null); router.refresh(); }} />
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WindowChip({ label, open, close }: { label: string; open: string; close: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-2 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-[11px] mt-0.5">
        <Calendar className="h-2.5 w-2.5 inline mr-0.5 text-muted-foreground" />
        {formatDate(open)} → {formatDate(close)}
      </div>
    </div>
  );
}

function CycleEditor({ cycle, onClose, onSaved }: { cycle: Cycle | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: cycle?.name ?? '',
    fiscalYear: cycle?.fiscalYear ?? '',
    goalSettingOpen: cycle?.goalSettingOpen.slice(0, 10) ?? '',
    goalSettingClose: cycle?.goalSettingClose.slice(0, 10) ?? '',
    q1Open: cycle?.q1Open.slice(0, 10) ?? '',
    q1Close: cycle?.q1Close.slice(0, 10) ?? '',
    q2Open: cycle?.q2Open.slice(0, 10) ?? '',
    q2Close: cycle?.q2Close.slice(0, 10) ?? '',
    q3Open: cycle?.q3Open.slice(0, 10) ?? '',
    q3Close: cycle?.q3Close.slice(0, 10) ?? '',
    q4Open: cycle?.q4Open.slice(0, 10) ?? '',
    q4Close: cycle?.q4Close.slice(0, 10) ?? '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await saveCycle({ id: cycle?.id, ...form });
    setSaving(false);
    if (r.ok) {
      toast.success(cycle ? 'Cycle updated' : 'Cycle created');
      onSaved();
    } else toast.error(r.error);
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
      <Card className="border-atom-500/30 bg-atom-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cycle name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FY 2026-27" />
            </div>
            <div className="space-y-1.5">
              <Label>Fiscal year</Label>
              <Input value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })} placeholder="e.g. 2026-27" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(['goalSetting', 'q1', 'q2', 'q3', 'q4'] as const).map((q) => (
              <div key={q} className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest">{q === 'goalSetting' ? 'Goal-Setting' : q.toUpperCase()}</Label>
                <Input type="date" value={(form as any)[q + 'Open']} onChange={(e) => setForm({ ...form, [q + 'Open']: e.target.value })} className="text-[11px]" />
                <Input type="date" value={(form as any)[q + 'Close']} onChange={(e) => setForm({ ...form, [q + 'Close']: e.target.value })} className="text-[11px]" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="gradient" size="sm" onClick={save} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? 'Saving…' : 'Save cycle'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ThrustAreasGrid({ cycleId, areas, onChanged }: { cycleId: string; areas: ThrustArea[]; onChanged: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {areas.map((a) => (
        <ThrustAreaCard key={a.id} cycleId={cycleId} area={a} editing={editingId === a.id} onEdit={() => setEditingId(editingId === a.id ? null : a.id)} onSaved={() => { setEditingId(null); onChanged(); }} />
      ))}
      {adding && (
        <ThrustAreaCard cycleId={cycleId} area={null} editing onEdit={() => setAdding(false)} onSaved={() => { setAdding(false); onChanged(); }} />
      )}
      {!adding && (
        <button type="button" onClick={() => setAdding(true)} className="rounded-lg border-2 border-dashed border-border/60 hover:border-atom-500/50 hover:bg-atom-500/5 p-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all">
          <Plus className="h-4 w-4" /> Add thrust area
        </button>
      )}
    </div>
  );
}

function ThrustAreaCard({ cycleId, area, editing, onEdit, onSaved }: { cycleId: string; area: ThrustArea | null; editing: boolean; onEdit: () => void; onSaved: () => void }) {
  const [name, setName] = useState(area?.name ?? '');
  const [description, setDescription] = useState(area?.description ?? '');
  const [color, setColor] = useState(area?.color ?? '#6366f1');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await saveThrustArea({ id: area?.id, cycleId, name, description, color });
    setSaving(false);
    if (r.ok) { toast.success('Thrust area saved'); onSaved(); }
    else toast.error(r.error);
  }

  async function del() {
    if (!area?.id) return;
    if (!confirm('Delete "' + area.name + '"? Goals using it must be moved first.')) return;
    const r = await deleteThrustArea(area.id);
    if (r.ok) { toast.success('Deleted'); onSaved(); }
    else toast.error(r.error);
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/10 p-3 flex items-center gap-3 group">
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: area!.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{area!.name}</div>
          {area!.description && <div className="text-[11px] text-muted-foreground truncate">{area!.description}</div>}
        </div>
        <button type="button" onClick={onEdit} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-atom-500/30 bg-atom-500/5 p-3 space-y-2 sm:col-span-2">
      <div className="flex items-start gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9 rounded cursor-pointer border-0 bg-transparent" />
        <div className="flex-1 space-y-1.5">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Thrust area name" />
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={cn('h-5 w-5 rounded-full border-2', color === c ? 'border-foreground scale-110' : 'border-transparent')} style={{ background: c }} aria-label={'Color ' + c} />
            ))}
          </div>
        </div>
        <button type="button" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
      <div className="flex justify-between gap-2">
        {area?.id && (
          <Button variant="ghost" size="sm" onClick={del} className="text-rose-400 hover:bg-rose-500/10 gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="gradient" size="sm" onClick={save} disabled={saving || !name} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
      </div>
    </div>
  );
}