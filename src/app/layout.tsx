import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Price Crawler — Compare preços no ML e Shopee',
  description:
    'Encontre e compare preços de produtos no Mercado Livre e Shopee em segundos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
