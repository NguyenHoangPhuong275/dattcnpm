import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
});

const inter = Inter({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'LOTUS TRAVEL — Khám phá & Lập lịch trình du lịch thông minh',
  description: 'Hệ thống tổng hợp địa điểm, thời tiết, và lên lịch trình du lịch thông minh tối ưu hóa hành trình của bạn.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${plusJakarta.variable} ${inter.variable} ${spaceGrotesk.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans bg-[var(--color-bg)] text-[var(--color-text)] antialiased min-h-screen selection:bg-[var(--color-primary-darker)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
