'use client';

import { useState } from 'react';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { seedAllMockData } from '@/lib/mock-data';
import { Database, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const result = seedAllMockData();
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: result.message,
        });
        // Reload page after 1 second to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal',
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat seeding data',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview dan statistik aplikasi BeliRumahBareng
        </p>
      </div>
      <DashboardStats />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terkini</CardTitle>
            <CardDescription>Log aktivitas sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur aktivitas log akan segera tersedia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Laporan</CardTitle>
            <CardDescription>Laporan dan analitik</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur laporan akan segera tersedia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
            <CardDescription>Konfigurasi sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur pengaturan akan segera tersedia
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Seed Mock Data
          </CardTitle>
          <CardDescription>
            Muat semua mock data ke localStorage untuk pengujian dan pengembangan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tombol ini akan memuat semua mock data (properties, users, projects, interests, dan submissions) 
            ke localStorage. Data yang sudah ada akan ditimpa. Setelah seeding selesai, halaman akan otomatis 
            dimuat ulang untuk menampilkan data terbaru.
          </p>
          <Button 
            onClick={handleSeedData} 
            disabled={isSeeding}
            className="w-full sm:w-auto"
          >
            {isSeeding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sedang memuat data...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Seed Mock Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

