import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/header';
import MobileNav from '@/components/mobile-nav';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'BeliRumahBareng - Kepemilikan Properti Kolektif',
  description: 'Platform untuk pembelian properti kolektif, membuat kepemilikan properti lebih mudah diakses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen w-full flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
