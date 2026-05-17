'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function TrendChart({ data }: { data: { quarter: string; avgScore: number; checkInsCount: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="quarter" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} fontSize={11} width={32} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            cursor={{ stroke: 'rgba(99,102,241,0.4)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area type="monotone" dataKey="avgScore" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradScore)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}