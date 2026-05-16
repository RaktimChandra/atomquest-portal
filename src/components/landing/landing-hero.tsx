'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Target, TrendingUp, Shield, Sparkles, BarChart3, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AtomOrbit } from './atom-orbit';

const features: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }[] = [
  { icon: Target as React.ComponentType<{ className?: string }>,     title: 'Aligned Goals',       desc: 'Every goal links to a thrust area and rolls up to org priorities.' },
  { icon: Shield,     title: 'Audit-Ready',         desc: 'Immutable trail of every change, every approval, every check-in.' },
  { icon: TrendingUp, title: 'Real-Time Tracking',  desc: 'Quarterly check-ins with auto-computed progress scores.' },
  { icon: BarChart3,  title: 'Deep Analytics',      desc: 'QoQ trends, heatmaps, and manager effectiveness — at a glance.' },
];

const stats = [
  { value: '100%',  label: 'Weightage validated' },
  { value: '8 max', label: 'Goals per employee' },
  { value: '4 UoM', label: 'Measurement types' },
  { value: '3 roles', label: 'Role-based access' },
];

export function LandingHero() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated grid backdrop */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Aurora gradient blobs */}
      <div className="absolute inset-0 aurora-bg" />

      {/* Top nav */}
      <nav className="relative z-10 border-b border-border/40 backdrop-blur-md bg-background/30">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-atom-400 to-atom-600 blur-md opacity-60" />
              <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-atom-500 to-atom-700 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white"><circle cx="12" cy="12" r="2" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" /></svg>
              </div>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">AtomQuest</span>
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-muted-foreground border border-border/60 rounded px-1.5 py-0.5 ml-1">v1.0</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button variant="gradient" size="sm" className="gap-1.5">
                Launch Portal <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 container py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 backdrop-blur px-3 py-1 text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-muted-foreground">Built for AtomQuest Hackathon 2026</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
              >
                <span className="text-gradient">Goals that</span>
                <br />
                <span className="text-gradient-brand">actually align.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed"
              >
                The all-in-one goal setting & tracking portal — from creation and approval to quarterly check-ins and audit-ready governance. Intuitive for employees, powerful for managers, ironclad for HR.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/login">
                <Button variant="gradient" size="lg" className="gap-2 text-base">
                  <Sparkles className="h-4 w-4" /> Enter the portal
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="glass" size="lg" className="gap-2 text-base">
                  Explore features
                </Button>
              </Link>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/40"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                >
                  <div className="text-2xl font-bold font-display text-gradient-brand">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: 3D atom visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] lg:h-[600px]"
          >
            <AtomOrbit />
          </motion.div>
        </div>
      </section>

      {/* Features strip */}
      <section id="features" className="relative z-10 container py-20 border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <p className="text-sm font-medium text-atom-400 uppercase tracking-widest mb-3">Capabilities</p>
          <h2 className="font-display text-3xl lg:text-5xl font-bold tracking-tight mb-4">
            Every part of the goal lifecycle.
          </h2>
          <p className="text-muted-foreground">
            From cycle open to annual capture — engineered to be intuitive, reliable, and audit-ready.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-3d p-6 group"
            >
              <div className="h-10 w-10 rounded-lg bg-atom-500/10 flex items-center justify-center mb-4 group-hover:bg-atom-500/20 transition-colors">
                <f.icon className="h-5 w-5 text-atom-400" />
              </div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-3d relative overflow-hidden rounded-2xl p-10 lg:p-16 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-atom-500/10 via-purple-500/5 to-transparent" />
          <div className="relative">
            <Zap className="h-10 w-10 mx-auto mb-4 text-atom-400" />
            <h3 className="font-display text-3xl lg:text-4xl font-bold mb-3">Try every role. Right now.</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Demo credentials are seeded for Employee, Manager and Admin/HR. One click in.
            </p>
            <Link href="/login">
              <Button variant="gradient" size="xl" className="gap-2">
                Launch portal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-8 mt-10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>Crafted for <span className="text-foreground font-medium">Atomberg</span> · AtomQuest Hackathon 2026</div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> All flows operational</div>
        </div>
      </footer>
    </div>
  );
}
