import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

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
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              className: 'glass border-border/40',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
