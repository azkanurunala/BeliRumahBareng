'use client';

import { useEffect, useState } from 'react';
import PropertyCard from './property-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getProperties } from '@/lib/actions/property.actions';
import type { Property } from '@/lib/types';
import { LoadingScreen } from './loading-screen';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DiscoverTab() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getProperties({ page: 1, limit: 100 });
        if (result.success && result.data) {
          setProperties(result.data);
        } else {
          setError(result.error?.message || 'Gagal memuat properti');
        }
      } catch (err) {
        console.error('Error loading properties:', err);
        setError('Terjadi kesalahan saat memuat properti');
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Properti Terkurasi</CardTitle>
          <CardDescription>
            Jelajahi properti yang telah terverifikasi dan siap untuk investasi kolektif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingScreen message="Memuat properti..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Properti Terkurasi</CardTitle>
          <CardDescription>
            Jelajahi properti yang telah terverifikasi dan siap untuk investasi kolektif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Properti Terkurasi</CardTitle>
        <CardDescription>
          Jelajahi properti yang telah terverifikasi dan siap untuk investasi kolektif.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada properti tersedia saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
