'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute inset-0 mesh-hero" />

      <div className="absolute top-6 left-6 z-10">
        <Logo size={32} animated />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 glass rounded-2xl p-12 max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-rose-500" />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error. The audit trail captured this event — you can retry, or head back to safety.
          </p>
          {error.digest && (
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-3">Reference: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" size="lg" onClick={reset} className="gap-1.5 w-full sm:w-auto">
            <RotateCw className="h-4 w-4" /> Retry
          </Button>
          <Link href="/dashboard">
            <Button variant="gradient" size="lg" className="gap-1.5 w-full sm:w-auto btn-shimmer">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}