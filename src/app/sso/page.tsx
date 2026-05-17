'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Shield, CheckCircle2 } from 'lucide-react';

export default function SsoInitPage() {
  const router = useRouter();
  const [step, setStep] = useState<'redirect' | 'consent' | 'finish'>('redirect');

  useEffect(() => {
    const t1 = setTimeout(() => setStep('consent'), 900);
    const t2 = setTimeout(() => setStep('finish'), 1900);
    const t3 = setTimeout(() => router.push('/sso/callback?provider=entra&mockToken=demo-' + Date.now()), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 aurora-bg" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 glass rounded-2xl p-10 w-full max-w-md text-center space-y-6"
      >
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
          <svg viewBox="0 0 23 23" className="h-8 w-8">
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#7fba00" d="M12 1h10v10H12z" />
            <path fill="#00a4ef" d="M1 12h10v10H1z" />
            <path fill="#ffb900" d="M12 12h10v10H12z" />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Microsoft Entra ID</h1>
          <p className="text-xs text-muted-foreground">Simulated single sign-on · Production-ready integration path documented</p>
        </div>

        <div className="space-y-3 text-left">
          <Step icon={step === 'redirect' ? Loader2 : CheckCircle2} done={step !== 'redirect'} active={step === 'redirect'} label="Redirecting to login.microsoftonline.com" />
          <Step icon={step === 'consent' ? Loader2 : step === 'finish' ? CheckCircle2 : Shield} done={step === 'finish'} active={step === 'consent'} label="Validating tenant & consent" />
          <Step icon={step === 'finish' ? Loader2 : Shield} done={false} active={step === 'finish'} label="Issuing session token" />
        </div>

        <div className="text-[11px] text-muted-foreground italic">
          🛈 This is a UX simulation. To enable real Entra ID SSO, add the <code className="font-mono">AzureAD</code> provider to <code className="font-mono">auth.ts</code> with your tenant + client credentials.
        </div>
      </motion.div>
    </div>
  );
}

function Step({ icon: Icon, done, active, label }: { icon: any; done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className={'h-4 w-4 ' + (active ? 'animate-spin text-atom-400' : done ? 'text-emerald-400' : 'text-muted-foreground')} />
      <span className={active ? 'font-medium' : done ? 'text-muted-foreground line-through' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}