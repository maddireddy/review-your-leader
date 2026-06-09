import type { Metadata } from 'next';
import { Inter, Rajdhani } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from '@/components/Layout/PostHogProvider';
import { Navbar } from '@/components/Layout/Navbar';
import { ServiceWorker } from '@/components/Layout/ServiceWorker';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import type { Viewport } from 'next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
});

export const metadata: Metadata = {
  title: 'ReviewYourLeader — Know Your Representatives',
  description:
    "Explore India's political landscape. Discover your MP, MLA, their performance, tenure history, and ministry portfolios at a glance.",
  keywords: 'India, MP, MLA, constituencies, parliament, assembly, politicians, election',
  openGraph: {
    title: 'ReviewYourLeader',
    description: 'Know your Indian political representatives',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ReviewLeader',
  },
};

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${rajdhani.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <LanguageProvider>
          <PostHogProvider>
            <Navbar />
            {children}
            <ServiceWorker />
          </PostHogProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
