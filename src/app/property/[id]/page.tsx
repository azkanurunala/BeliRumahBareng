import { mockProperties, mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Building, Users, BadgeCheck, Home, User, Banknote, Landmark, Square, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);

  if (!property) {
    notFound();
  }
  
  const isCoBuilding = property.type === 'co-building';

  const unitPrices = Array.from({ length: property.totalUnits }, (_, i) => {
    let weight;
    if (isCoBuilding) {
      // Co-Building: Higher floors can be more expensive
      weight = 1.0 + (i * 0.05);
    } else {
      // Co-Owning Land: Price is mainly by size, maybe slight premium for "better" plots
      // For now, we'll use a simple differentiation
      weight = 1.0 + (i * 0.02);
    }
    return (property.price / property.totalUnits) * weight;
  });


  const formattedTotalPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(property.price);

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
  
  const interestedUsers = mockUsers.slice(1, 4);

  const getBadgeText = () => {
    return isCoBuilding ? 'Patungan Konstruksi' : 'Patungan Lahan';
  };

  const getTitle = () => {
    return isCoBuilding ? 'Gabung Grup Konstruksi' : 'Gabung Grup Patungan Lahan';
  };

  const getDescription = () => {
    return isCoBuilding 
      ? `Bangun dan miliki satu ${property.unitName.toLowerCase()} di properti ini.`
      : `Miliki satu ${property.unitName.toLowerCase()} tanah di lokasi ini.`;
  };

  const getButtonText = () => {
    return isCoBuilding ? 'Gabung Grup Konstruksi' : 'Gabung Grup Patungan';
  };
  
  const getPropertyTypeDesc = () => {
     if (isCoBuilding) return `Tanah & Proyek Konstruksi ${property.totalUnits} Lantai`;
     return `Lahan Siap Bagi ${property.totalUnits} Kavling`;
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto py-6 sm:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="relative h-96 w-full">
                  <Image
                    src={property.imageUrl}
                    alt={property.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={property.imageHint}
                  />
                </div>
                <CardHeader>
                  <Badge variant="secondary" className="mb-2 w-fit">
                    {getBadgeText()}
                  </Badge>
                  <CardTitle className="text-3xl font-bold">{property.name}</CardTitle>
                  <CardDescription className="flex items-center text-lg text-muted-foreground">
                    <MapPin className="mr-2 h-5 w-5" />
                    {property.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-base">{property.description}</p>
                   <Accordion type="single" collapsible className="w-full mt-6" defaultValue='item-1'>
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <h3 className="text-lg font-semibold flex items-center"><Building className="mr-2 h-5 w-5" /> Detail Properti</h3>
                      </AccordionTrigger>
                      <AccordionContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
                        <div className="flex items-center gap-2"><Home className="h-4 w-4 text-primary" /><p><strong>Tipe Proyek:</strong> {getPropertyTypeDesc()}</p></div>
                        <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /><p><strong>Sertifikat Induk:</strong> SHM</p></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p><strong>Kapasitas Grup:</strong> {property.totalUnits} {property.unitName}</p></div>
                        {!isCoBuilding && property.unitSize && (
                           <div className="flex items-center gap-2"><Square className="h-4 w-4 text-primary" /><p><strong>Luas per Kavling:</strong> ~{property.unitSize}{property.unitMeasure}</p></div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{getTitle()}</CardTitle>
                  <CardDescription>
                    {getDescription()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className='border-b pb-2 text-center'>
                    <p className="text-sm text-muted-foreground">Total Nilai Proyek</p>
                    <p className="text-2xl font-bold">{formattedTotalPrice}</p>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-base font-semibold">
                        Lihat Estimasi Biaya per {property.unitName}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{property.unitName}</TableHead>
                              <TableHead className="text-right">Estimasi Harga</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unitPrices.map((price, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {property.unitName} {index + 1}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary">{formatPrice(price)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                         <p className="text-xs text-muted-foreground mt-2 italic">
                          *Harga bersifat estimasi dan dapat bervariasi tergantung posisi/ukuran final.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Button size="lg" className="w-full">
                    {getButtonText()}
                  </Button>
                   <p className="text-xs text-center text-muted-foreground">
                    Dengan bergabung, Anda menyetujui syarat dan ketentuan kepemilikan bersama.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Anggota Tertarik</CardTitle>
                   <CardDescription>Pengguna lain yang tertarik dengan properti ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {interestedUsers.map(user => (
                     <div key={user.id} className="flex items-center gap-3">
                       <Avatar>
                         <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} />
                         <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-semibold">{user.name}</p>
                         <p className="text-xs text-muted-foreground">Ingin tinggal di {user.profile.locationPreference}</p>
                       </div>
                       <Button variant="outline" size="sm" className="ml-auto">Hubungkan</Button>
                     </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
