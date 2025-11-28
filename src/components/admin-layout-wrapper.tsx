'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import MobileNav from '@/components/mobile-nav';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Untuk admin route, tidak render Header, Footer, dan MobileNav
    return <>{children}</>;
  }

  // Untuk non-admin route, render dengan Header, Footer, dan MobileNav
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}

