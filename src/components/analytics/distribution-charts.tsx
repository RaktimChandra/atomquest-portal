'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { UOM_LABELS } from '@/lib/utils';

const STATUS_PALETTE: Record<string, string> = {
  DRAFT: '#71717a',
  SUBMITTED: '#f59e0b',
  APPROVED: '#10b981',
  LOCKED: '#6366f1',
  RETURNED: '#ef4444',
};

const UOM_PALETTE: Record<string, string> = {
  NUMERIC_MIN: '#10b981',
  NUMERIC_MAX: '#06b6d4',
  PERCENTAGE_MIN: '#8b5cf6',
  PERCENTAGE_MAX: '#ec4899',
  TIMELINE: '#f59e0b',
  ZERO_BASED: '#ef4444',
};

export function ThrustDistribution({ data }: { data: { name: string; color: string; count: number; totalWeight: number }[] }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Distribution</div>
          <h3 className="font-display text-base font-bold tracking-tight">By thrust area</h3>
        </div>
        <div className="h-52">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {data.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                formatter={(value: any, _name: any, entry: any) => [value + ' goals · ' + entry.payload.totalWeight + '% wt', entry.payload.name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1 mt-2 max-h-32 overflow-y-auto pr-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
              <span className="font-mono">{d.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UomDistribution({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([k, v]) => ({ name: UOM_LABELS[k]?.split(' ')[0] ?? k, full: UOM_LABELS[k] ?? k, value: v, color: UOM_PALETTE[k] ?? '#71717a' }));
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Measurement</div>
          <h3 className="font-display text-base font-bold tracking-tight">UoM types</h3>
        </div>
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(value: any, _n: any, entry: any) => [value + ' goals', entry.payload.full]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusDistribution({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([k, v]) => ({ name: k, value: v, color: STATUS_PALETTE[k] ?? '#71717a' }));
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Lifecycle</div>
          <h3 className="font-display text-base font-bold tracking-tight">Goal status</h3>
        </div>
        <div className="h-52">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={75} paddingAngle={2}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                formatter={(value: any, name: any) => [value + ' goals', name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1 mt-2">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
              <span className="font-mono">{d.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}