import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import AppProviders from '@/components/AppProviders';
import AppFooter from '@/components/AppFooter';
import './globals.css';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LOTUS TRAVEL — Khám phá và lên kế hoạch du lịch',
  description:
    'Khám phá điểm đến, theo dõi thời tiết và lên kế hoạch cho hành trình Việt Nam.',
  icons: { icon: '/images/logo.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={beVietnamPro.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="font-sans bg-[var(--color-bg)] text-[var(--color-text)] antialiased flex min-h-screen flex-col selection:bg-[var(--color-primary-darker)] selection:text-white"
        suppressHydrationWarning
      >
        <AppProviders>
          <div className="flex-1">{children}</div>
          <AppFooter />
        </AppProviders>
      </body>
    </html>
  );
}
