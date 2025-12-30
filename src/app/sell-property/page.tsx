'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SellPropertyForm } from '@/components/sell-property-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SellPropertyPage() {
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






