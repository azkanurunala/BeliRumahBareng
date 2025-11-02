import { mockProperties } from '@/lib/mock-data';
import PropertyCard from './property-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function DiscoverTab() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Properti Terkurasi</CardTitle>
            <CardDescription>
                Jelajahi properti yang telah terverifikasi dan siap untuk investasi kolektif.
            </CardDescription>
        </CardHeader>
        <CardContent>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {mockProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
