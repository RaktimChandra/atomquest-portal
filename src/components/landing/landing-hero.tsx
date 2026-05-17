'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Shield, BarChart3, Zap, CheckCircle2, ArrowDown, Sparkles, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Magnetic } from '@/components/ui/magnetic';
import { AtomV2 } from './atom-v2';

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Target,     title: 'Aligned Goals',       desc: 'Every goal links to a thrust area and rolls up to org priorities.' },
  { icon: Shield,     title: 'Audit-Ready',         desc: 'Immutable trail of every change, every approval, every check-in.' },
  { icon: BarChart3,  title: 'Deep Analytics',      desc: 'QoQ trends, heatmaps, manager effectiveness — at a glance.' },
  { icon: Zap,        title: 'Auto-Escalation',     desc: 'Configurable rules surface blockers before they become misses.' },
];

const stats = [
  { value: 100, label: 'Weightage validated', suffix: '%' },
  { value: 8,   label: 'Goals per employee', suffix: ' max' },
  { value: 4,   label: 'Measurement formulas', suffix: '' },
  { value: 3,   label: 'Role-based journeys', suffix: '' },
];

export function LandingHero() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Backdrops */}
      <div className="absolute inset-0 dot-grid opacity-50" />
      <div className="absolute inset-0 mesh-hero" />

      {/* Top nav */}
      <nav className="relative z-10 border-b border-border/40 backdrop-blur-md bg-background/40">
        <div className="container flex h-16 items-center justify-between">
          <Logo size={32} animated />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Magnetic strength={0.3}>
              <Link href="/login">
                <Button variant="gradient" size="sm" className="gap-1.5 btn-shimmer">
                  Launch Portal <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </Magnetic>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 container pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur px-3 py-1 text-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-muted-foreground">Built for AtomQuest Hackathon 2026</span>
            </motion.div>

            <div className="space-y-5">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-5xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-[-0.04em] leading-[0.95]"
              >
                Goals that<br />
                <span className="text-brand">actually align.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed"
              >
                The all-in-one goal setting & tracking portal — from creation and approval through quarterly check-ins to audit-ready governance. Intuitive for employees. Powerful for managers. Ironclad for HR.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-3"
            >
              <Magnetic strength={0.25}>
                <Link href="/login">
                  <Button variant="gradient" size="lg" className="gap-2 text-base btn-shimmer">
                    <Sparkles className="h-4 w-4" /> Enter the portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Magnetic>
              <Link href="#features">
                <Button variant="outline" size="lg" className="gap-2 text-base">
                  Explore features
                </Button>
              </Link>
            </motion.div>

            {/* Stats — number tickers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-border/40"
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.05 }}
                >
                  <div className="text-3xl lg:text-4xl font-bold font-display tnum text-brand tracking-tight">
                    <NumberTicker value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: 3D atom v2 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-[420px] sm:h-[500px] lg:h-[620px]"
          >
            <AtomV2 />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center mt-8"
        >
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}>
              <ArrowDown className="h-5 w-5" />
            </motion.div>
          </a>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 container py-24 border-t border-border/40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">Capabilities</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Every part of the <span className="text-brand">goal lifecycle.</span>
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
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="card-3d p-6 group"
            >
              <div className="h-11 w-11 rounded-xl bg-brand flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
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
          viewport={{ once: true, amount: 0.4 }}
          className="card-3d relative overflow-hidden rounded-2xl p-12 lg:p-20 text-center"
        >
          <div className="absolute inset-0 mesh-hero opacity-60" />
          <div className="relative">
            <div className="inline-flex h-12 w-12 rounded-xl bg-brand items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display text-3xl lg:text-5xl font-bold tracking-tight mb-3">Try every role.<br className="hidden sm:inline" /> Right now.</h3>
            <p className="text-muted-foreground mb-7 max-w-md mx-auto">
              Demo credentials are seeded for Employee, Manager and Admin/HR. One click in.
            </p>
            <Magnetic strength={0.3}>
              <Link href="/login">
                <Button variant="gradient" size="xl" className="gap-2 btn-shimmer">
                  Launch portal <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Magnetic>
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