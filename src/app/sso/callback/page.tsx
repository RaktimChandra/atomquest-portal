'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function SsoCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function go() {
      const token = params.get('mockToken');
      if (!token) {
        setStatus('error');
        setError('Missing mock token');
        return;
      }
      // Mock SSO: in real life we'd verify the JWT, look up the user by their entra OID,
      // and create a session. Here, sign them in as the admin demo user.
      const result = await signIn('credentials', {
        email: 'admin@atomberg.com',
        password: 'demo1234',
        redirect: false,
      });
      if (result?.error) {
        setStatus('error');
        setError(result.error);
      } else {
        setStatus('success');
        setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 900);
      }
    }
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative z-10 glass rounded-2xl p-10 w-full max-w-md text-center space-y-5"
    >
      {status === 'pending' && (
        <>
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-brand" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Completing sign-in…</h1>
          <p className="text-sm text-muted-foreground">Finalizing your session.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome.</h1>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-10 w-10 mx-auto text-rose-500" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Sign-in failed</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="text-sm text-brand hover:underline">Back to login</a>
        </>
      )}
    </motion.div>
  );
}

function SsoCallbackFallback() {
  return (
    <div className="relative z-10 glass rounded-2xl p-10 w-full max-w-md text-center space-y-5">
      <Loader2 className="h-10 w-10 mx-auto animate-spin text-brand" />
      <h1 className="font-display text-2xl font-bold tracking-tight">Preparing sign-in…</h1>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute inset-0 mesh-hero" />
      <Suspense fallback={<SsoCallbackFallback />}>
        <SsoCallbackInner />
      </Suspense>
    </div>
  );
}