'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PropertyForm } from '@/components/admin/property-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { Property } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { useState, useEffect } from 'react';
import { getPropertySubmission } from '@/lib/actions/property-submission.actions';

export default function NewPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { createProperty, propertySubmissions } = useAdminData();
  const [initialProperty, setInitialProperty] = useState<Property | undefined>(undefined);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  
  const submissionId = searchParams.get('fromSubmission');

  // Fetch submission data if fromSubmission query param exists
  useEffect(() => {
    const loadSubmissionData = async () => {
      if (!submissionId) return;
      
      setIsLoadingSubmission(true);
      try {
        // Try to get from context first (faster)
        const submissionFromContext = propertySubmissions.find(s => s.id === submissionId);
        
        if (submissionFromContext) {
          // Convert submission to Property format
          const property: Property = {
            id: `prop-${Date.now()}`,
            name: submissionFromContext.name,
            description: submissionFromContext.description,
            price: submissionFromContext.askingPrice,
            totalArea: submissionFromContext.totalArea,
            buildingArea: undefined, // Submission doesn't have buildingArea
            location: submissionFromContext.location,
            images: submissionFromContext.images || [],
            type: submissionFromContext.type,
            totalUnits: submissionFromContext.totalUnits,
            unitSize: submissionFromContext.unitSize,
            unitMeasure: submissionFromContext.unitMeasure || 'm²',
            unitName: (submissionFromContext.type === 'co-building'
              ? 'Lantai'
              : submissionFromContext.totalUnits
              ? 'Kavling'
              : 'Kepemilikan') as const,
            planningInfo: {
              sitePlanUrl: '',
              sitePlanHint: '',
              developmentPlan: '',
              environmentalAnalysis: '',
            },
          };
          setInitialProperty(property);
        } else {
          // Fallback: fetch from API
          const result = await getPropertySubmission(submissionId);
          if (result.success && result.data) {
            const submission = result.data;
            const property: Property = {
              id: `prop-${Date.now()}`,
              name: submission.name,
              description: submission.description,
              price: submission.askingPrice,
              totalArea: submission.totalArea,
              buildingArea: undefined,
              location: submission.location,
              images: submission.images || [],
              type: submission.type,
              totalUnits: submission.totalUnits,
              unitSize: submission.unitSize,
              unitMeasure: submission.unitMeasure || 'm²',
              unitName: (submission.type === 'co-building'
                ? 'Lantai'
                : submission.totalUnits
                ? 'Kavling'
                : 'Kepemilikan') as const,
              planningInfo: {
                sitePlanUrl: '',
                sitePlanHint: '',
                developmentPlan: '',
                environmentalAnalysis: '',
              },
            };
            setInitialProperty(property);
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Gagal memuat data submission',
            });
          }
        }
      } catch (error) {
        console.error('Error loading submission:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat data submission',
        });
      } finally {
        setIsLoadingSubmission(false);
      }
    };

    loadSubmissionData();
  }, [submissionId, propertySubmissions, toast]);

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
          {isLoadingSubmission ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data dari submission...</p>
            </div>
          ) : (
            <PropertyForm
              property={initialProperty}
              onSubmit={handleSubmit}
              onCancel={() => router.push('/admin/properties')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

