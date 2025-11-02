'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Users, KeyRound, ArrowRight } from 'lucide-react';
import PropertyCard from '@/components/property-card';
import { mockProperties } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function HomePage() {
  const featuredProperties = mockProperties.slice(0, 3);
  const heroImage = PlaceHolderImages.find(p => p.id === 'property-1');

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-center text-white">
          <div className="absolute inset-0 bg-black/50 z-10" />
          {heroImage && (
             <Image
                src={heroImage.imageUrl}
                alt="Modern house background"
                fill
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
                priority
              />
          )}
          <div className="relative z-20 max-w-2xl mx-auto px-4">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Miliki Properti Impian, Bersama-sama.
            </h1>
            <p className="mt-4 text-lg md:text-xl">
              BeliRumahBareng adalah platform investasi properti kolektif pertama di Indonesia. Wujudkan kepemilikan properti dengan modal lebih terjangkau.
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
              <h2 className="text-3xl font-bold">Bagaimana Caranya?</h2>
              <p className="mt-2 text-muted-foreground">
                Miliki properti hanya dengan tiga langkah mudah.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Search className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">1. Temukan Properti</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Jelajahi daftar properti yang telah dikurasi dan diverifikasi oleh tim ahli kami.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">2. Gabung Grup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Bergabunglah dengan grup pembelian bersama atau temukan rekan investor dengan profil serupa.</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <CardTitle className="mt-4">3. Miliki Bersama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Selesaikan proses legal dan pendanaan untuk secara resmi memiliki bagian Anda dari properti.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Properties Section */}
        <section id="featured-properties" className="py-12 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-3xl font-bold">Properti Unggulan</h2>
              <p className="mt-2 text-muted-foreground">
                Lihat beberapa peluang investasi properti kolektif yang sedang tren saat ini.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link href="/discover">Lihat Semua Properti</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="relative isolate overflow-hidden bg-primary/90 px-6 py-20 text-center shadow-2xl sm:rounded-3xl sm:px-16">
               <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Siap Memulai Investasi Properti Pertama Anda?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Jangan tunda lagi impian Anda. Bergabunglah dengan ratusan investor lain dan wujudkan kepemilikan properti dengan cara yang lebih cerdas dan terjangkau.
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
