'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ExportCard() {
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null);

  async function download(format: 'csv' | 'xlsx') {
    setDownloading(format);
    try {
      const url = format === 'csv' ? '/api/export/achievement' : '/api/export/achievement/xlsx';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const dl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl;
      a.download = 'atomquest-achievement-' + new Date().toISOString().slice(0, 10) + '.' + format;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(dl);
      toast.success(format.toUpperCase() + ' export downloaded');
    } catch (e: any) {
      toast.error('Export failed', { description: e?.message });
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-atom-400 font-semibold flex items-center gap-1.5">
            <Download className="h-3 w-3" /> Achievement export
          </div>
          <div className="font-display text-lg font-bold tracking-tight mt-1">Planned vs Actual</div>
          <div className="text-xs text-muted-foreground">All employees · all goals · all quarters · with computed scores.</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => download('csv')} disabled={!!downloading} className="gap-1.5">
            {downloading === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} CSV
          </Button>
          <Button variant="gradient" onClick={() => download('xlsx')} disabled={!!downloading} className="gap-1.5">
            {downloading === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}