'use client';

import { motion } from 'framer-motion';
import { Target, Users, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendChart } from './trend-chart';
import { ThrustDistribution, UomDistribution, StatusDistribution } from './distribution-charts';
import { ManagerEffectiveness } from './manager-effectiveness';
import { Heatmap } from './heatmap';
import { OrgGalaxy3D } from './org-galaxy-3d';

type Props = {
  thrustDistribution: { name: string; color: string; count: number; totalWeight: number }[];
  uomDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  qoqTrend: { quarter: string; avgScore: number; checkInsCount: number }[];
  heatmap: { department: string; q1: number; q2: number; q3: number; q4: number }[];
  managerEffectiveness: { managerId: string; managerName: string; department: string; reportCount: number; checkInRate: number; avgScore: number }[];
  galaxyUsers: { id: string; name: string; role: string; department: string; managerId: string | null; goalCount: number; approvedCount: number; avgScore: number }[];
  totalGoals: number;
  totalUsers: number;
};

export function AnalyticsDashboard(props: Props) {
  const totalCheckIns = props.qoqTrend.reduce((s, q) => s + q.checkInsCount, 0);
  const avgScore = props.qoqTrend.length === 0 ? 0 : Math.round(props.qoqTrend.reduce((s, q) => s + q.avgScore, 0) / props.qoqTrend.filter((q) => q.avgScore > 0).length || 0);

  return (
    <div className="space-y-6">
      {/* Top metric tiles */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Tile icon={Users} label="People in scope" value={props.totalUsers} color="from-atom-500 to-indigo-600" />
        <Tile icon={Target} label="Total goals" value={props.totalGoals} color="from-emerald-500 to-teal-600" />
        <Tile icon={Activity} label="Check-ins logged" value={totalCheckIns} color="from-amber-500 to-orange-600" />
        <Tile icon={TrendingUp} label="Average score" value={avgScore || 0} suffix="/100" color="from-purple-500 to-pink-600" />
      </div>

      {/* 3D galaxy — the showpiece */}
      <Card>
        <CardContent className="p-0">
          <div className="p-5 border-b border-border/40">
            <div className="text-xs uppercase tracking-widest text-atom-400 font-semibold mb-1">★ Signature view</div>
            <h2 className="font-display text-xl font-bold tracking-tight">Org-Goal Alignment Galaxy</h2>
            <p className="text-xs text-muted-foreground">Each user is a node; managers anchor their teams; goals orbit as glowing particles. Drag to rotate, scroll to zoom.</p>
          </div>
          <OrgGalaxy3D users={props.galaxyUsers} />
        </CardContent>
      </Card>

      {/* Trend chart */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Quarter-on-Quarter</div>
            <h2 className="font-display text-xl font-bold tracking-tight">Average score trend</h2>
          </div>
          <TrendChart data={props.qoqTrend} />
        </CardContent>
      </Card>

      {/* Distribution row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ThrustDistribution data={props.thrustDistribution} />
        <UomDistribution data={props.uomDistribution} />
        <StatusDistribution data={props.statusDistribution} />
      </div>

      {/* Heatmap */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Completion heatmap</div>
            <h2 className="font-display text-xl font-bold tracking-tight">Department × Quarter</h2>
            <p className="text-xs text-muted-foreground">% of approved goals with a check-in logged.</p>
          </div>
          <Heatmap data={props.heatmap} />
        </CardContent>
      </Card>

      {/* Manager effectiveness */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Leadership</div>
            <h2 className="font-display text-xl font-bold tracking-tight">Manager effectiveness</h2>
            <p className="text-xs text-muted-foreground">Ranked by check-in completion rate across their team.</p>
          </div>
          <ManagerEffectiveness data={props.managerEffectiveness} />
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ icon: Icon, label, value, suffix, color }: { icon: any; label: string; value: number; suffix?: string; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="relative overflow-hidden">
        <div className={'absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ' + color + ' opacity-15 blur-2xl'} />
        <CardContent className="p-5 relative">
          <div className={'h-9 w-9 rounded-lg bg-gradient-to-br ' + color + ' flex items-center justify-center shadow-glow-sm mb-3'}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="font-display text-2xl font-bold tracking-tight">{value}{suffix && <span className="text-base text-muted-foreground">{suffix}</span>}</div>
          <div className="text-xs font-medium mt-0.5">{label}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}