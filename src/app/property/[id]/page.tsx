import { mockProperties, mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Building, Users, BadgeCheck, Home, User, Banknote, Landmark } from 'lucide-react';
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
  
  const coBuyUnits = property.units;
  const floorWeights = Array.from({ length: coBuyUnits }, (_, i) => 1.3 - (i * 0.2)).reverse();
  const totalWeight = floorWeights.reduce((sum, weight) => sum + weight, 0);
  const floorPrices = floorWeights.map(weight => (property.price / totalWeight) * weight).reverse();

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

  const isCoBuilding = property.type === 'co-building';

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
                    {isCoBuilding ? 'Ready for Co-Building' : 'Ready for Co-Living'}
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
                        <h3 className="text-lg font-semibold flex items-center"><Building className="mr-2 h-5 w-5" /> Property Details</h3>
                      </AccordionTrigger>
                      <AccordionContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
                        <div className="flex items-center gap-2"><Home className="h-4 w-4 text-primary" /><p><strong>Type:</strong> {isCoBuilding ? 'Land for Flat' : 'Apartment'}</p></div>
                        <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /><p><strong>Certificate:</strong> SHM</p></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p><strong>Capacity:</strong> {coBuyUnits} Units/Floors</p></div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isCoBuilding ? 'Join Co-Building Group' : 'Join Co-Living Group'}</CardTitle>
                  <CardDescription>
                    {isCoBuilding ? 'Build and own a floor of this property.' : 'Own a floor in this apartment.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className='border-b pb-2 text-center'>
                    <p className="text-sm text-muted-foreground">Est. Total Project Cost</p>
                    <p className="text-2xl font-bold">{formattedTotalPrice}</p>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-base font-semibold">
                        View Cost per Floor
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Floor</TableHead>
                              <TableHead className="text-right">Est. Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {floorPrices.map((price, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {index === 0 ? 'Ground Floor' : `Floor ${index + 1}`}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary">{formatPrice(price)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Button size="lg" className="w-full">
                    {isCoBuilding ? 'Join Building Group' : 'Join Buying Group'}
                  </Button>
                   <p className="text-xs text-center text-muted-foreground">
                    By joining, you agree to our terms for co-ownership.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Interested Members</CardTitle>
                   <CardDescription>Other users interested in this property.</CardDescription>
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
                         <p className="text-xs text-muted-foreground">Wants to live in {user.profile.locationPreference}</p>
                       </div>
                       <Button variant="outline" size="sm" className="ml-auto">Connect</Button>
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
