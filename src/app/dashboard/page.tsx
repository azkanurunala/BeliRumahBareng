'use client';

import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { useAdminData } from '@/contexts/admin-data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingInline } from '@/components/loading-inline';
import PropertyCard from '@/components/property-card';
import { getProperties } from '@/lib/actions/property.actions';
import type { Property } from '@/lib/types';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const { getUserInterests, getUserWatchlists } = useUserData();
  const { properties } = useAdminData();
  const router = useRouter();
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (!isAuthenticated) {
      router.push('/auth/login');
    }
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  // Load recommended properties when user has no data
  useEffect(() => {
    const loadRecommendedProperties = async () => {
      const interests = getUserInterests();
      const watchlists = getUserWatchlists();
      const hasNoData = interests.length === 0 && watchlists.length === 0;

      if (hasNoData && isAuthenticated && !isAdmin && user?.id) {
        setIsLoadingProperties(true);
        try {
          const result = await getProperties({ page: 1, limit: 3 });
          if (result.success && result.data) {
            setRecommendedProperties(result.data);
          }
        } catch (error) {
          console.error('Error loading recommended properties:', error);
        } finally {
          setIsLoadingProperties(false);
        }
      } else {
        setIsLoadingProperties(false);
      }
    };

    if (!isLoading) {
      loadRecommendedProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, user?.id, isLoading]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 sm:py-10">
        <LoadingInline message="Memuat dashboard..." />
      </div>
    );
  }

  if (!isAuthenticated || !user || isAdmin) {
    return null;
  }

  const interests = getUserInterests();
  const watchlists = getUserWatchlists();

  const interestProperties = interests.map(interest => {
    const property = properties.find(p => p.id === interest.propertyId);
    return { interest, property };
  }).filter(item => item.property);

  const watchlistProperties = watchlists.map(watchlist => {
    const property = properties.find(p => p.id === watchlist.propertyId);
    return { watchlist, property };
  }).filter(item => item.property);

  // Check if user has no interests and no watchlists
  const hasNoData = interests.length === 0 && watchlists.length === 0;

  return (
    <main className="flex-1 bg-muted/20">
      <div className="container mx-auto py-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Minat dan Watchlist</h1>
          <p className="text-muted-foreground mt-2">
            Kelola minat dan properti yang Anda simpan
          </p>
        </div>

        {hasNoData ? (
          <div className="space-y-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Belum ada proyek yang diikuti</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Jelajahi properti yang tersedia dan bergabunglah dengan proyek patungan untuk mewujudkan impian properti Anda.
                </p>
                <Button asChild size="lg">
                  <Link href="/discover">
                    Jelajahi Properti
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {isLoadingProperties ? (
              <Card>
                <CardContent className="py-12">
                  <LoadingInline message="Memuat rekomendasi properti..." />
                </CardContent>
              </Card>
            ) : recommendedProperties.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Mulai dengan Properti Ini
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Jelajahi properti yang tersedia untuk memulai proyek co-buy pertama Anda
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
                <div className="text-center pt-4">
                  <Button asChild variant="outline" className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105">
                    <Link href="/discover">Lihat Semua Properti</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Tabs defaultValue="interests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="interests" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Pernyataan Minat ({interests.length})
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Watchlist ({watchlists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interests" className="space-y-4">
            {interestProperties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">Belum ada pernyataan minat</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Jelajahi properti dan nyatakan minat Anda untuk bergabung dengan proyek
                  </p>
                  <Button asChild>
                    <Link href="/discover">
                      Jelajahi Properti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interestProperties.map(({ interest, property }) => {
                  if (!property) return null;
                  
                  const isFlexible = !property.totalUnits && property.totalArea;
                  const isCoBuilding = property.type === 'co-building';
                  
                  return (
                    <Link key={interest.id} href={`/property/${property.id}`} className="block">
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="relative h-48 w-full">
                          <Image
                            src={property.images[0]?.url || '/images/placeholder.png'}
                            alt={property.name}
                            fill
                            className="object-cover"
                            data-ai-hint={property.images[0]?.hint || 'property image'}
                          />
                          <Badge 
                            className="absolute top-2 right-2"
                            variant={interest.status === 'approved' ? 'default' : interest.status === 'rejected' ? 'destructive' : 'secondary'}
                          >
                            {interest.status === 'approved' ? 'Disetujui' : interest.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{property.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2 text-xs">
                            {interest.unitId && (
                              <Badge variant="outline">
                                {property.unitName} {interest.unitId}
                              </Badge>
                            )}
                            {interest.isFirstHome && (
                              <Badge variant="outline">Rumah Pertama</Badge>
                            )}
                            {interest.willOccupy && (
                              <Badge variant="outline">Akan Ditempati</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>Dibuat: {new Date(interest.createdAt).toLocaleDateString('id-ID')}</p>
                          </div>
                          <Button 
                            className="w-full pointer-events-none" 
                            variant="outline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Lihat Detail
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
            {watchlistProperties.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold mb-2">Watchlist kosong</p>
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Simpan properti yang menarik untuk dilihat nanti
                  </p>
                  <Button asChild>
                    <Link href="/discover">
                      Jelajahi Properti
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {watchlistProperties.map(({ watchlist, property }) => {
                  if (!property) return null;
                  
                  const isFlexible = !property.totalUnits && property.totalArea;
                  const isCoBuilding = property.type === 'co-building';
                  
                  return (
                    <Link key={watchlist.id} href={`/property/${property.id}`} className="block">
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="relative h-48 w-full">
                          <Image
                            src={property.images[0]?.url || '/images/placeholder.png'}
                            alt={property.name}
                            fill
                            className="object-cover"
                            data-ai-hint={property.images[0]?.hint || 'property image'}
                          />
                          <Badge className="absolute top-2 right-2">
                            {isFlexible ? 'Fleksibel' : isCoBuilding ? 'Bangunan' : 'Lahan'}
                          </Badge>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{property.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {property.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-xs text-muted-foreground">
                            <p>Disimpan: {new Date(watchlist.createdAt).toLocaleDateString('id-ID')}</p>
                          </div>
                          <Button 
                            className="w-full pointer-events-none" 
                            variant="outline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Lihat Detail
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </main>
  );
}

