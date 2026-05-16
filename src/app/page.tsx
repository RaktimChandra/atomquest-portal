import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LandingHero } from '@/components/landing/landing-hero';

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');
  return <LandingHero />;
}
