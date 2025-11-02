'use client';

import type { User } from '@/lib/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, DollarSign, Target, Clock, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ProfileDetailClient({ user }: { user: User }) {
  if (!user) {
    notFound();
  }

  return (
    <main className="flex-1 bg-muted/20">
      <div className="container mx-auto max-w-3xl py-6 sm:py-10">
        <div className='mb-4'>
            <Link href="/" className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
            <ArrowLeft size={16} />
            Kembali
          </Link>
        </div>
        <Card className="overflow-hidden">
            <CardHeader className="flex-col items-center gap-4 border-b bg-background/50 p-6 text-center sm:flex-row sm:text-left">
              <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover" />
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>Anggota BeliRumahBareng sejak 2024</CardDescription>
              </div>
          </CardHeader>
          <CardContent className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Preferensi Investasi</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MapPin size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Lokasi Pilihan</p>
                          <p className="font-semibold">{user.profile.locationPreference}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <DollarSign size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Rentang Harga</p>
                          <p className="font-semibold">{user.profile.priceRange}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Target size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Tujuan Investasi</p>
                          <p className="font-semibold">{user.profile.investmentGoals}</p>
                      </div>
                  </div>
                    <div className="flex items-start gap-3 rounded-lg border p-4">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Home size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Kapasitas Finansial</p>
                          <p className="font-semibold">{user.profile.financialCapacity}</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-4 sm:col-span-2">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Clock size={18} />
                      </div>
                      <div>
                          <p className="text-sm text-muted-foreground">Horison Waktu</p>
                          <p className="font-semibold">{user.profile.timeHorizon}</p>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
