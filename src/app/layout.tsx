import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LOTUS TRAVEL — Khám phá & Lập lịch trình du lịch thông minh',
  description:
    'Hệ thống tổng hợp địa điểm, thời tiết, và lên lịch trình du lịch thông minh tối ưu hóa hành trình của bạn.',
  icons: { icon: '/images/logo.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${beVietnamPro.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-sans bg-[var(--color-bg)] text-[var(--color-text)] antialiased min-h-screen selection:bg-[var(--color-primary-darker)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
