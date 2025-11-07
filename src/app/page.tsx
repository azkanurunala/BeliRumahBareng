'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Users, KeyRound, ArrowRight } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { mockProperties } from '@/lib/mock-data';

export default function HomePage() {
  const featuredProperties = mockProperties.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <Image
            src="/images/floor-plans/01.png"
            alt="Modern house background"
            fill
            className="object-cover"
            data-ai-hint="property cover"
            priority
          />
          <div className="relative z-20 max-w-2xl mx-auto px-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Kepemilikan Properti Jadi Lebih Mudah, Bersama-sama.
            </h1>
            <p className="mt-4 text-lg md:text-xl">
              BeliRumahBareng membuka jalan baru untuk memiliki properti. Dengan patungan, Anda bisa membeli lahan luas atau membangun hunian dengan biaya yang jauh lebih terjangkau.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/discover">
                Jelajahi Properti <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold">Bagaimana BeliRumahBareng Bekerja?</h2>
              <p className="mt-2 text-muted-foreground">
                Miliki properti impian Anda melalui tiga langkah sederhana.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">1. Patungan Beli Lahan Luas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Beli tanah dalam ukuran besar bersama grup membuat harga per meter jadi jauh lebih murah.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">2. Bangun Properti Bersama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Ingin hunian vertikal? Patungan bangun flat atau apartemen untuk memangkas biaya konstruksi tanpa developer.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">3. Miliki Bagian Anda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Selesaikan proses legal dan miliki kavling atau unit properti Anda dengan hak yang jelas dan berkekuatan hukum.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <section id="featured-properties" className="py-12 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold">Peluang Patungan Populer</h2>
              <p className="mt-2 text-muted-foreground">
                Lihat beberapa peluang kepemilikan properti kolektif yang sedang tren saat ini.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link href="/discover">Lihat Semua Peluang</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="relative isolate overflow-hidden bg-primary/90 px-6 py-20 text-center shadow-2xl sm:rounded-3xl sm:px-16">
               <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Siap Memiliki Properti Dengan Cara Cerdas?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Jangan biarkan harga mahal menghalangi impian Anda. Bergabunglah dengan komunitas BeliRumahBareng dan wujudkan kepemilikan properti yang lebih terjangkau.
              </p>
              <div className="mt-8 flex items-center justify-center gap-x-6">
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                   <Link href="/discover">Mulai Sekarang</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
