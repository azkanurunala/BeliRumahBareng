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
    const isFlexible = !property.totalUnits && property.totalArea;

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(isFlexible ? property.price / property.totalArea! : property.price / property.totalUnits!);

  const getBadgeText = () => {
    switch (property.type) {
      case 'co-building':
        return 'Patungan Bangunan';
      case 'co-owning':
        return isFlexible ? 'Patungan Fleksibel' : 'Patungan Lahan';
      default:
        return 'Siap Patungan';
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group border-2 hover:border-primary/20">
      <CardHeader className="p-0 relative overflow-hidden">
        <div className="relative aspect-video">
          {/* Gradient overlay saat hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          <Image
            src={property.images[0].url}
            alt={property.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint={property.images[0].hint}
          />
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <Badge className="mb-2 bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0 shadow-sm">
          {getBadgeText()}
        </Badge>
        <CardTitle className="mb-1 text-lg font-semibold">{property.name}</CardTitle>
        <CardDescription className="flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          {property.location}
        </CardDescription>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{property.description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-secondary/30 p-4">
        <div>
            <p className="text-xs text-muted-foreground">
                {isFlexible ? `Harga per ${property.unitMeasure}`: `Estimasi per ${property.unitName}`}
            </p>
            <p className="text-lg font-bold text-primary">{formattedPrice}</p>
        </div>
        <Link href={`/property/${property.id}`} passHref>
          <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
            Lihat Detail
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

    