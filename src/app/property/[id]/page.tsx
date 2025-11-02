import { mockProperties, mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Building, Users, BadgeCheck, Home, User, Banknote } from 'lucide-react';
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

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);

  if (!property) {
    notFound();
  }
  
  const coBuyUnits = 4; // Example: plan for a 4-story flat
  const pricePerUnit = property.price / coBuyUnits;

  const formattedTotalPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(property.price);

  const formattedPricePerUnit = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(pricePerUnit);
  
  const interestedUsers = mockUsers.slice(1, 4);

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
                  <Badge variant="secondary" className="mb-2 w-fit">Ready for Co-Buy</Badge>
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
                        <div className="flex items-center gap-2"><Home className="h-4 w-4 text-primary" /><p><strong>Type:</strong> Land for Flat</p></div>
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
                  <CardTitle>Join Co-Building Group</CardTitle>
                  <CardDescription>Build and own a floor of this property.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className='flex justify-between items-center border-b pb-2'>
                     <div>
                        <p className="text-sm font-medium">Cost per Floor</p>
                        <p className="text-2xl font-bold text-primary">{formattedPricePerUnit}</p>
                      </div>
                      <div className='text-right'>
                        <p className="text-sm text-muted-foreground">Total {coBuyUnits} People</p>
                        <p className="text-sm text-muted-foreground">Est. Total: {formattedTotalPrice}</p>
                      </div>
                  </div>
                  <div className='flex items-center gap-2 pt-2'>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className='text-sm text-muted-foreground'>{coBuyUnits - 1} people needed to start</p>
                  </div>
                  <Button size="lg" className="w-full">
                    Join Building Group
                  </Button>
                   <p className="text-xs text-center text-muted-foreground">
                    By joining, you agree to our terms for co-building and ownership.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Interested Members</CardTitle>
                   <CardDescription>Other users interested in this build.</CardDescription>
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
