
import { mockProperties } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import PropertyDetailClient from './property-detail-client';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);

  if (!property) {
    notFound();
  }

  return <PropertyDetailClient property={property} />;
}
