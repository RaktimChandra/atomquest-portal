'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Edit3, Save, Loader2, Users, Target, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUser } from '@/lib/actions/admin';
import { cn, initials, ROLE_LABELS } from '@/lib/utils';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  managerId: string | null;
  managerName: string | null;
  reportCount: number;
  goalCount: number;
};

export function OrgManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.designation && u.designation.toLowerCase().includes(q))
    );
  }, [users, query]);

  const groups = useMemo(() => ({
    ADMIN: filtered.filter((u) => u.role === 'ADMIN'),
    MANAGER: filtered.filter((u) => u.role === 'MANAGER'),
    EMPLOYEE: filtered.filter((u) => u.role === 'EMPLOYEE'),
  }), [filtered]);

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, dept, designation…" className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((role) => (
        <div key={role} className="space-y-2">
          <div className="text-xs uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
            {role === 'ADMIN' && <Sparkle role={role} />}
            {ROLE_LABELS[role]} <span className="text-foreground/30 font-normal">· {groups[role].length}</span>
          </div>
          {groups[role].length === 0 ? (
            <div className="text-xs text-muted-foreground italic">No users.</div>
          ) : (
            <div className="space-y-2">
              {groups[role].map((u) => (
                <UserRow key={u.id} user={u} managers={managers.filter((m) => m.id !== u.id)} editing={editingId === u.id} onEdit={() => setEditingId(editingId === u.id ? null : u.id)} onSaved={() => { setEditingId(null); router.refresh(); }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Sparkle({ role }: { role: string }) {
  return <span className={cn('h-1.5 w-1.5 rounded-full', role === 'ADMIN' ? 'bg-rose-400' : role === 'MANAGER' ? 'bg-amber-400' : 'bg-emerald-400')} />;
}

function UserRow({ user, managers, editing, onEdit, onSaved }: { user: User; managers: User[]; editing: boolean; onEdit: () => void; onSaved: () => void }) {
  const [managerId, setManagerId] = useState(user.managerId ?? 'none');
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER' | 'ADMIN'>(user.role as any);
  const [department, setDepartment] = useState(user.department ?? '');
  const [designation, setDesignation] = useState(user.designation ?? '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const r = await updateUser({
      userId: user.id,
      managerId: managerId === 'none' ? null : managerId,
      role,
      department: department || null,
      designation: designation || null,
    });
    setSaving(false);
    if (r.ok) { toast.success('Updated'); onSaved(); }
    else toast.error(r.error);
  }

  return (
    <motion.div layout>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {user.name}
                <Badge variant="outline" className="text-[10px] py-0">{user.role}</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">{user.designation ?? '—'} {user.department ? '· ' + user.department : ''} · {user.email}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {user.reportCount} reports</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {user.goalCount} goals</span>
                {user.managerName && <span>· reports to {user.managerName}</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5">
              {editing ? <X className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
              {editing ? 'Close' : 'Edit'}
            </Button>
          </div>

          {editing && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/40 pt-3 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin / HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Manager</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger><SelectValue placeholder="No manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No manager —</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Engineering" />
              </div>
              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Engineer" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button variant="gradient" size="sm" onClick={save} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save changes
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}