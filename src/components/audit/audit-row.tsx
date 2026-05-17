'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Plus, Edit3, Trash2, CheckCircle2, RotateCcw, Lock, Unlock, ClipboardCheck, Share2, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, initials, formatDate } from '@/lib/utils';

const actionConfig: Record<string, { icon: typeof Plus; tone: string; label: string }> = {
  CREATE:   { icon: Plus,           tone: 'text-emerald-400', label: 'Created' },
  UPDATE:   { icon: Edit3,          tone: 'text-blue-400',    label: 'Updated' },
  DELETE:   { icon: Trash2,         tone: 'text-rose-400',    label: 'Deleted' },
  APPROVE:  { icon: CheckCircle2,   tone: 'text-emerald-400', label: 'Approved' },
  RETURN:   { icon: RotateCcw,      tone: 'text-amber-400',   label: 'Returned' },
  LOCK:     { icon: Lock,           tone: 'text-indigo-400',  label: 'Locked' },
  UNLOCK:   { icon: Unlock,         tone: 'text-amber-400',   label: 'Unlocked' },
  CHECKIN:  { icon: ClipboardCheck, tone: 'text-purple-400',  label: 'Check-in' },
  SHARE:    { icon: Share2,         tone: 'text-cyan-400',    label: 'Shared' },
  ESCALATE: { icon: AlertTriangle,  tone: 'text-rose-400',    label: 'Escalated' },
};

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  metadata: string | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
};

export function AuditRow({ entry }: { entry: AuditEntry }) {
  const cfg = actionConfig[entry.action] ?? actionConfig.UPDATE;
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);

  const before = entry.beforeJson ? safeParse(entry.beforeJson) : null;
  const after = entry.afterJson ? safeParse(entry.afterJson) : null;
  const hasDetails = before || after || entry.metadata;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-xl card-3d p-4 hover:border-atom-500/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-foreground/5', cfg.tone)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-sm">
                <span className="font-semibold">{entry.user.name}</span>
                <span className="text-muted-foreground"> · {cfg.label.toLowerCase()} </span>
                <Badge variant="outline" className="text-[10px] py-0">{entry.entityType}</Badge>
              </div>
            </div>
            {entry.metadata && (
              <div className="text-xs text-muted-foreground mt-0.5">{entry.metadata}</div>
            )}
            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
              {new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              <span className="ml-2">· {entry.user.role}</span>
            </div>
          </div>
          {hasDetails && (before || after) && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
              {expanded ? <>Hide <ChevronUp className="h-3 w-3" /></> : <>Diff <ChevronDown className="h-3 w-3" /></>}
            </button>
          )}
        </div>

        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-border/40 grid sm:grid-cols-2 gap-3">
            {before && (
              <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5">
                <div className="text-[10px] uppercase tracking-widest text-rose-400 font-semibold mb-1">Before</div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap break-words text-foreground/80">{JSON.stringify(before, null, 2)}</pre>
              </div>
            )}
            {after && (
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1">After</div>
                <pre className="text-[11px] font-mono whitespace-pre-wrap break-words text-foreground/80">{JSON.stringify(after, null, 2)}</pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}