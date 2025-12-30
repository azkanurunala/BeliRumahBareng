'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function SellPropertyConfirmationPage() {
  return (
    <main className="flex-1 bg-muted/20">
      <div className="container mx-auto py-6 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Data Penjualan Diterima</CardTitle>
              <CardDescription className="text-base mt-2">
                Terima kasih telah mengajukan properti Anda ke platform BeliRumahBareng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Data penjualan properti Anda telah berhasil diterima oleh tim kami.
                </p>
                <p className="text-sm text-muted-foreground">
                  Jika properti sesuai dengan kebutuhan kami, Anda akan dihubungi oleh tim BeliRumahBareng untuk diskusi lebih lanjut.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/projects">
                    Lihat Proyek Saya
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Beranda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
