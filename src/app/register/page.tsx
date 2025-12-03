'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get redirect parameter if exists
    const redirect = searchParams.get('redirect');
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    
    // Redirect to /auth/register with same parameters
    router.replace(`/auth/register${redirectParam}`);
  }, [router, searchParams]);

  return (
    <main className="flex-1 bg-muted/20">
      <LoadingScreen message="Mengarahkan ke halaman pendaftaran..." />
    </main>
  );
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Memuat..." />}>
      <RegisterRedirectContent />
    </Suspense>
  );
}



