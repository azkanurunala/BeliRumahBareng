import Image from 'next/image';
import type { Property } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';
import { Badge } from './ui/badge';
import Link from 'next/link';

type PropertyCardProps = {
  property: Property;
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(property.price / property.units);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={property.imageUrl}
            alt={property.name}
            fill
            className="object-cover"
            data-ai-hint={property.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Badge variant="secondary" className="mb-2">
          {property.type === 'co-building' ? 'Ready for Co-Building' : 'Ready for Co-Living'}
        </Badge>
        <CardTitle className="mb-1 text-lg font-semibold">{property.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          {property.location}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-secondary/30 p-4">
        <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-lg font-bold text-primary">{formattedPrice}</p>
        </div>
        <Link href={`/property/${property.id}`} passHref>
          <Button asChild>
            <a>View Details</a>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
