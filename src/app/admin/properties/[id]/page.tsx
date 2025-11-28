'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyForm } from '@/components/admin/property-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProperty, updateProperty } = useAdminData();
  
  const property = getProperty(id);
  
  if (!property) {
    notFound();
  }

  const handleSubmit = (data: any) => {
    updateProperty(id, data);
    
    toast({
      title: 'Berhasil',
      description: 'Property berhasil diperbarui',
    });
    
    router.push('/admin/properties');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
        <p className="text-muted-foreground">
          Edit informasi properti
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{property.name}</CardTitle>
          <CardDescription>
            Edit informasi lengkap tentang properti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyForm
            property={property}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/properties')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

