import type { Metadata } from 'next';
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const geist = Geist({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'AtomQuest — Goal Setting & Tracking Portal',
  description: 'Enterprise-grade goal management. Aligned. Visible. Audit-ready. Built for Atomberg.',
  keywords: ['goal tracking', 'performance management', 'OKR', 'atomberg', 'atomquest'],
  authors: [{ name: 'Raktim Chandra' }],
  openGraph: {
    title: 'AtomQuest — Goal Setting & Tracking Portal',
    description: 'Enterprise-grade goal management built for Atomberg.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'glass border-border/40',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}