'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyForm } from '@/components/admin/property-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { Property } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function NewPropertyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createProperty } = useAdminData();

  const handleSubmit = (data: any) => {
    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      ...data,
    };
    
    createProperty(newProperty);
    
    toast({
      title: 'Berhasil',
      description: 'Property berhasil ditambahkan',
    });
    
    router.push('/admin/properties');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Tambah Property Baru</h1>
          <p className="text-muted-foreground">
            Tambahkan properti baru ke sistem
          </p>
          <div className="mt-2">
            <Breadcrumb items={[
              { label: 'Properties', href: '/admin/properties' },
              { label: 'Tambah Baru' }
            ]} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Property</CardTitle>
          <CardDescription>
            Isi informasi lengkap tentang properti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/properties')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

