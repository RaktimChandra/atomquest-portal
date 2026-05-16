'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, FileText, ArrowRight, User2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { initials, cn } from '@/lib/utils';

type Report = {
  id: string;
  name: string;
  email: string;
  designation: string | null;
  department: string | null;
  goals: any[];
  submitted: any[];
  approved: any[];
  returned: any[];
  draft: any[];
  status: 'pending' | 'approved' | 'returned' | 'draft' | 'empty';
  totalSubmittedWeight: number;
};

const statusConfig = {
  pending:  { icon: Clock,        label: 'Awaiting review', tone: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  approved: { icon: CheckCircle2, label: 'Approved',        tone: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  returned: { icon: AlertCircle,  label: 'Returned',        tone: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
  draft:    { icon: FileText,     label: 'In draft',        tone: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20' },
  empty:    { icon: FileText,     label: 'Not started',     tone: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border/40' },
};

export function ApprovalInbox({ reports }: { reports: Report[] }) {
  // Group: pending first (most actionable), then returned, approved, draft, empty
  const order: Report['status'][] = ['pending', 'returned', 'approved', 'draft', 'empty'];
  const grouped = order.map((s) => ({ status: s, items: reports.filter((r) => r.status === s) })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => {
        const cfg = statusConfig[group.status];
        return (
          <div key={group.status} className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold">
              <cfg.icon className={cn('h-3.5 w-3.5', cfg.tone)} />
              <span className={cfg.tone}>{cfg.label}</span>
              <span className="text-muted-foreground font-normal">· {group.items.length}</span>
            </div>
            <div className="space-y-2">
              {group.items.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/dashboard/approvals/${r.id}`}>
                    <Card className="hover:border-atom-500/40 transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-atom-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {initials(r.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{r.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.designation ?? ''} {r.department ? '· ' + r.department : ''}</div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 text-xs">
                          <div className="text-center">
                            <div className="font-display font-bold text-lg">{r.submitted.length}</div>
                            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Pending</div>
                          </div>
                          <div className="h-8 w-px bg-border/40" />
                          <div className="text-center">
                            <div className="font-display font-bold text-lg">{r.approved.length}</div>
                            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Locked</div>
                          </div>
                          <div className="h-8 w-px bg-border/40" />
                          <div className="text-center">
                            <div className="font-display font-bold text-lg">{r.goals.length}</div>
                            <div className="text-muted-foreground text-[10px] uppercase tracking-wide">Total</div>
                          </div>
                        </div>
                        {group.status === 'pending' && (
                          <Badge variant="warning" className="ml-2">
                            {r.totalSubmittedWeight.toFixed(0)}% allocated
                          </Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}