'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
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
        <div className="mx-auto h-16 w-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Compass className="h-7 w-7 text-white" />
        </div>

        <div className="space-y-2">
          <div className="font-display text-6xl font-bold tracking-tight text-brand">404</div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Off the orbit</h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for isn't here. Let's get you back to a known position.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-1.5 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" /> Landing
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="gradient" size="lg" className="gap-1.5 w-full sm:w-auto btn-shimmer">
              Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}