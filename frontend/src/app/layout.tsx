import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '../hooks/useAuth';
import AppLayout from '@/components/AppLayout';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'SmartERP - Billing & Inventory',
  description: 'Tally-inspired keyboard-first ERP billing, inventory, and accounting portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
