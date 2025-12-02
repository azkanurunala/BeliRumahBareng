'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="container mx-auto py-6 sm:py-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
      </div>
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
            <CardDescription>
              Masuk untuk melanjutkan ke BeliRumahBareng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Belum punya akun? </span>
              <Link href="/auth/register" className="text-primary hover:underline">
                Daftar di sini
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






