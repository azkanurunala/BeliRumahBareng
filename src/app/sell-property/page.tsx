'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SellPropertyForm } from '@/components/sell-property-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/loading-screen';

export default function SellPropertyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      // Redirect to register with return URL
      router.push('/auth/register?redirect=/sell-property');
    }
  }, [user, authLoading, router]);

  // Show loading only while checking auth
  if (authLoading) {
    return (
      <main className="flex-1 bg-muted/20">
        <LoadingScreen message="Memeriksa autentikasi..." />
      </main>
    );
  }

  // If not loading and no user, show nothing (redirecting)
  if (!user) {
    return null;
  }

  return (
    <main className="flex-1 bg-muted/20">
      <div className="container mx-auto py-6 sm:py-10">
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Jual Properti ke Platform</CardTitle>
              <CardDescription>
                Isi form di bawah ini untuk mengajukan properti Anda sebagai objek patungan pembelian. Tim kami akan menghubungi Anda untuk proses selanjutnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SellPropertyForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}






