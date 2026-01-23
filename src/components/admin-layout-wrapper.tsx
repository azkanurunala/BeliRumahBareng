'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import MobileNav from '@/components/mobile-nav';
import { useAuth } from '@/contexts/auth-context';
import { LoadingScreen } from '@/components/loading-screen';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAuth();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background">
          <LoadingScreen fullScreen={true} message="Memuat aplikasi..." />
        </div>
      )}

      <div className={isLoading ? 'hidden' : ''}>
        {isAdminRoute ? (
          <>{children}</>
        ) : (
          <>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <MobileNav />
          </>
        )}
      </div>
    </>
  );
}

