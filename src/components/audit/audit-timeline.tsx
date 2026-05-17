'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Search } from 'lucide-react';
import { AuditRow } from './audit-row';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const ALL_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'RETURN', 'LOCK', 'CHECKIN', 'SHARE', 'ESCALATE'];

export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filter && e.action !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          e.user.name.toLowerCase().includes(q) ||
          e.user.email.toLowerCase().includes(q) ||
          e.entityType.toLowerCase().includes(q) ||
          (e.metadata && e.metadata.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [entries, filter, query]);

  // Group by day
  const groups = useMemo(() => {
    const map: Record<string, AuditEntry[]> = {};
    for (const e of filtered) {
      const day = new Date(e.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!map[day]) map[day] = [];
      map[day].push(e);
    }
    return Object.entries(map);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by user, entity, or note…" className="pl-9" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mr-1"><Filter className="h-3 w-3" /> Action:</div>
            <button onClick={() => setFilter(null)} className={cn('text-[11px] uppercase tracking-wide px-2 py-1 rounded-full font-semibold transition-colors', !filter ? 'bg-atom-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>All</button>
            {ALL_ACTIONS.map((a) => (
              <button key={a} onClick={() => setFilter(filter === a ? null : a)} className={cn('text-[11px] uppercase tracking-wide px-2 py-1 rounded-full font-semibold transition-colors', filter === a ? 'bg-atom-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>{a}</button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} of {entries.length} events shown</div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-display text-xl font-semibold mb-1.5">No audit events match</h3>
            <p className="text-sm text-muted-foreground">Try a different filter or search query.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, list]) => (
            <div key={day} className="space-y-2">
              <div className="sticky top-16 z-10 inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded">
                {day} <Badge variant="outline" className="text-[10px] py-0 px-1.5">{list.length}</Badge>
              </div>
              <div className="space-y-2 ml-1 border-l border-border/40 pl-4 relative">
                {list.map((e) => <AuditRow key={e.id} entry={e} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}