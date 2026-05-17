'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Eye, EyeOff, Shield, UserCog, User2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const demoUsers: { role: string; email: string; name: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { role: 'Admin / HR', email: 'admin@atomberg.com',    name: 'Priya Sharma',  icon: Shield,  color: 'from-rose-500 to-pink-500' },
  { role: 'Manager',    email: 'manager@atomberg.com',  name: 'Rohan Kapoor',  icon: UserCog, color: 'from-amber-500 to-orange-500' },
  { role: 'Employee',   email: 'employee@atomberg.com', name: 'Arjun Patel',   icon: User2,   color: 'from-emerald-500 to-teal-500' },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      toast.error('Invalid credentials. Try one of the demo accounts on the right.');
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    }
  }

  function quickFill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('demo1234');
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 aurora-bg" />

      {/* Floating brand wordmark, top-left */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 z-10">
        <div className="relative h-8 w-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-atom-400 to-atom-600 blur-md opacity-60" />
          <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-atom-500 to-atom-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white"><circle cx="12" cy="12" r="2" fill="currentColor" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" /></svg>
          </div>
        </div>
        <span className="font-display text-lg font-bold tracking-tight">AtomQuest</span>
      </Link>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-stretch">
        {/* LEFT: Login form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass rounded-2xl p-8 lg:p-10"
        >
          <div className="space-y-1 mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your goal sheet — Employee, Manager or Admin.</p>
          </div>

          {/* Mock SSO */}
          <Button
            variant="outline"
            className="w-full mb-4 h-11 gap-2"
            onClick={() => { window.location.href = '/sso'; }}
          >
            <svg className="h-4 w-4" viewBox="0 0 23 23"><path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#7fba00" d="M12 1h10v10H12z" /><path fill="#00a4ef" d="M1 12h10v10H1z" /><path fill="#ffb900" d="M12 12h10v10H12z" /></svg>
            Continue with Microsoft Entra ID
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background/40 backdrop-blur px-2 text-muted-foreground">or with credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" placeholder="you@atomberg.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? 'Signing you in…' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Demo password for all roles: <span className="font-mono text-foreground">demo1234</span>
          </p>
        </motion.div>

        {/* RIGHT: Quick-fill demo cards */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-atom-400">
              <Sparkles className="h-3 w-3" /> One-click demo
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Three roles. Three journeys.</h2>
            <p className="text-sm text-muted-foreground">
              Tap any persona below to autofill credentials. Then hit sign in to experience that role's view.
            </p>
          </div>

          <div className="space-y-3">
            {demoUsers.map((u, i) => (
              <motion.button
                key={u.email}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                onClick={() => quickFill(u.email)}
                className="w-full text-left card-3d p-4 group hover:border-atom-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${u.color} flex items-center justify-center shadow-glow-sm`}>
                    <u.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.role} · {u.email}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="card-3d p-4 mt-2">
            <div className="text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Audit-trail enabled on all actions</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Role-based access strictly enforced</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" /> Sample cycle + thrust areas pre-seeded</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
