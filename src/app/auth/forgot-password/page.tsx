'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto py-6 sm:py-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Login
          </Link>
        </Button>
      </div>
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email atau nomor telepon Anda untuk mendapatkan link reset password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline">
                Kembali ke halaman login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

