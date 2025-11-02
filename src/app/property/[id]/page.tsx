import { mockProperties, mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Building, Users, AreaChart, BadgeCheck, Clock, Wallet, Info } from 'lucide-react';
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

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(property.price);
  
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
                   <Accordion type="single" collapsible className="w-full mt-6">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <h3 className="text-lg font-semibold flex items-center"><Building className="mr-2 h-5 w-5" /> Property Details</h3>
                      </AccordionTrigger>
                      <AccordionContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
                        <div className="flex items-center gap-2"><AreaChart className="h-4 w-4 text-primary" /><p><strong>Type:</strong> Land</p></div>
                        <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /><p><strong>Certificate:</strong> SHM</p></div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>
                         <h3 className="text-lg font-semibold flex items-center"><Info className="mr-2 h-5 w-5" /> Investment Overview</h3>
                      </AccordionTrigger>
                      <AccordionContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
                         <div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /><p><strong>Target Price:</strong> {formattedPrice}</p></div>
                         <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><p><strong>Time Horizon:</strong> 5-10 years</p></div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Start a Co-Buy Group</CardTitle>
                  <CardDescription>Invest in this property with others.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Price</p>
                    <p className="text-2xl font-bold text-primary">{formattedPrice}</p>
                  </div>
                  <Button size="lg" className="w-full">
                    Initiate Co-Buy
                  </Button>
                   <p className="text-xs text-center text-muted-foreground">
                    By initiating, you agree to our terms and conditions for co-ownership.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> Interested Members</CardTitle>
                   <CardDescription>Other users looking at this property.</CardDescription>
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
                         <p className="text-xs text-muted-foreground">{user.profile.investmentGoals}</p>
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
