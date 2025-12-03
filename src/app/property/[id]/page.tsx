import { notFound } from 'next/navigation';
import PropertyDetailClient from './property-detail-client';
import { getProperty } from '@/lib/actions/property.actions';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const result = await getProperty(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PropertyDetailClient property={result.data} />;
}
