import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/LayoutWrapper';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PVC — Payroll Validation Collection System',
  description: 'Centralized monthly payroll validation upload, review, and compliance portal for 50+ station managers and management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={publicSans.variable}>
      <body className={`${publicSans.className} antialiased text-slate-900 bg-slate-100 min-h-screen selection:bg-indigo-600 selection:text-white`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
