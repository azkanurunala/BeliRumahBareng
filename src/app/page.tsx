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
          {/* Gradient Overlay yang lebih menarik */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-black/30 z-10" />
          <Image
            src="/images/floor-plans/01.png"
            alt="Modern house background"
            fill
            className="object-cover"
            data-ai-hint="property cover"
            priority
          />
          <div className="relative z-20 max-w-2xl mx-auto px-4 animate-in fade-in duration-1000">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
              Kepemilikan Properti Jadi Lebih Mudah, Bersama-sama.
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90">
              BeliRumahBareng membuka jalan baru untuk memiliki properti. Dengan patungan, Anda bisa membeli lahan luas atau membangun hunian dengan biaya yang jauh lebih terjangkau.
            </p>
            <Button asChild size="lg" className="mt-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
              <div className="inline-block mb-4">
                <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-2" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Bagaimana BeliRumahBareng Bekerja?
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-2" />
              </div>
              <p className="mt-2 text-muted-foreground">
                Miliki properti impian Anda melalui tiga langkah sederhana.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/30">
                <CardHeader>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary relative group">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" />
                    <Search className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="mt-4">1. Patungan Beli Lahan Luas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Beli tanah dalam ukuran besar bersama grup membuat harga per meter jadi jauh lebih murah.</p>
                </CardContent>
              </Card>
              <Card className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/30">
                <CardHeader>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary relative group">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" />
                    <Users className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <CardTitle className="mt-4">2. Bangun Properti Bersama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Ingin hunian vertikal? Patungan bangun flat atau apartemen untuk memangkas biaya konstruksi tanpa developer.</p>
                </CardContent>
              </Card>
              <Card className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/30">
                <CardHeader>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary relative group">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-100" />
                    <KeyRound className="h-6 w-6 relative z-10 transition-transform duration-300 group-hover:scale-110" />
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
              <div className="inline-block mb-4">
                <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-2" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Peluang Patungan Populer
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-2" />
              </div>
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
              <Button asChild variant="outline" className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105">
                <Link href="/discover">Lihat Semua Peluang</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-12 md:py-24 bg-background relative overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 animate-gradient" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="relative isolate overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-20 text-center shadow-2xl sm:rounded-3xl sm:px-16 border border-primary/20">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,_white_1px,_transparent_0)] [background-size:20px_20px]" />
              
              <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl relative z-10">
                Siap Memiliki Properti Dengan Cara Cerdas?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80 relative z-10">
                Jangan biarkan harga mahal menghalangi impian Anda. Bergabunglah dengan komunitas BeliRumahBareng dan wujudkan kepemilikan properti yang lebih terjangkau.
              </p>
              <div className="mt-8 flex items-center justify-center gap-x-6 relative z-10">
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
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
