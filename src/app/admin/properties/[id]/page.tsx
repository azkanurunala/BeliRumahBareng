'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyForm } from '@/components/admin/property-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProperty, updateProperty } = useAdminData();
  
  const property = getProperty(id);
  
  if (!property) {
    notFound();
  }

  const handleSubmit = async (data: any) => {
    try {
      await updateProperty(id, data);
      
      toast({
        title: 'Berhasil',
        description: 'Property berhasil diperbarui',
      });
      
      router.push('/admin/properties');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Gagal memperbarui property',
      });
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
          <p className="text-muted-foreground">
            Edit informasi properti
          </p>
          <div className="mt-2">
            <Breadcrumb items={[
              { label: 'Properties', href: '/admin/properties' },
              { label: property.name, href: `/admin/properties/${id}/detail` },
              { label: 'Edit' }
            ]} />
          </div>
        </div>
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

