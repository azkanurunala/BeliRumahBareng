
'use client';

import { useState } from 'react';
import { mockProperties, mockUsers } from '@/lib/mock-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Building, Users, BadgeCheck, Home, Square, ArrowLeft, AreaChart, DraftingCompass, Microscope, CheckCircle } from 'lucide-react';
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
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';


export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = mockProperties.find((p) => p.id === params.id);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const { toast } = useToast();

  if (!property) {
    notFound();
  }
  
  const isCoBuilding = property.type === 'co-building';

  const unitPrices = Array.from({ length: property.totalUnits }, (_, i) => {
    let weight;
    const floorWeight = isCoBuilding ? (property.totalUnits - i -1) * 0.05 : (i * 0.02);

    weight = 1.0 + floorWeight;
    
    if (isCoBuilding && i === 0) {
      weight = 1.0 + ((property.totalUnits - 1) * 0.05) + 0.10;
    } else if(isCoBuilding) {
       weight = 1.0 + (property.totalUnits - 1 - i) * 0.05;
    } else {
       weight = 1.0 + (i * 0.02);
    }
    
    if(isCoBuilding) {
        const basePricePerUnit = property.price / property.totalUnits;
        const premium = (property.totalUnits - 1 - i) * 0.05;
        return basePricePerUnit * (1 + premium);

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
    return isCoBuilding ? 'Patungan Bangunan' : 'Patungan Lahan';
  };

  const getTitle = () => {
    return isCoBuilding ? 'Gabung Grup Bangunan' : 'Gabung Grup Patungan Lahan';
  };

  const getDescription = () => {
    return isCoBuilding 
      ? `Bangun dan miliki satu ${property.unitName.toLowerCase()} di properti ini.`
      : `Miliki satu ${property.unitName.toLowerCase()} tanah di lokasi ini.`;
  };

  const getButtonText = () => {
    return isCoBuilding ? 'Gabung Grup Bangunan' : 'Gabung Grup Patungan';
  };
  
  const getPropertyTypeDesc = () => {
     if (isCoBuilding) return `Tanah & Proyek Bangunan ${property.totalUnits} Lantai`;
     return `Lahan Siap Bagi ${property.totalUnits} Kavling`;
  }

  const getUnitSize = (index: number) => {
    if (isCoBuilding || !property.unitSize) return null;
    const baseSize = property.unitSize;
    const variation = (index - Math.floor(property.totalUnits / 2)) * 2;
    return baseSize + variation;
  }
  
  const handleJoinProject = () => {
    if (!selectedUnit) {
      toast({
        variant: "destructive",
        title: "Pilihan Dibutuhkan",
        description: `Silakan pilih ${property.unitName} yang Anda inginkan.`,
      });
      return;
    }
    
    toast({
      title: "Berhasil Bergabung (Simulasi)",
      description: `Anda telah memilih ${property.unitName} ${selectedUnit}. Tim kami akan segera menghubungi Anda untuk langkah selanjutnya.`,
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto py-6 sm:py-10">
          <div className='mb-4'>
             <Link href="/" className='flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground'>
               <ArrowLeft size={16} />
               Kembali ke Jelajah
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <Carousel className="w-full">
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-96 w-full">
                          <Image
                            src={image.url}
                            alt={`${property.name} - gambar ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint={image.hint}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
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
              {property.planningInfo && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle>Perencanaan & Detail Proyek</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="plan">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="plan"><DraftingCompass className="mr-2 h-4 w-4" />Denah Lokasi</TabsTrigger>
                        <TabsTrigger value="dev"><AreaChart className="mr-2 h-4 w-4" />Rencana Pengembangan</TabsTrigger>
                        <TabsTrigger value="env"><Microscope className="mr-2 h-4 w-4" />Analisis Lingkungan</TabsTrigger>
                      </TabsList>
                      <TabsContent value="plan" className="mt-4">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                          <Image src={property.planningInfo.sitePlanUrl} alt="Denah Lokasi" fill className="object-contain" data-ai-hint={property.planningInfo.sitePlanHint} />
                        </div>
                      </TabsContent>
                      <TabsContent value="dev" className="mt-4 text-sm text-muted-foreground">
                        <p>{property.planningInfo.developmentPlan}</p>
                      </TabsContent>
                      <TabsContent value="env" className="mt-4 text-sm text-muted-foreground">
                        <p>{property.planningInfo.environmentalAnalysis}</p>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
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
                                  {isCoBuilding ? `${property.unitName} ${index + 1}` : 
                                  <div className='flex flex-col'>
                                    <span>{`${property.unitName} ${index + 1}`}</span>
                                    {property.unitSize && (
                                      <span className='text-xs text-muted-foreground'>
                                        ~{getUnitSize(index)}{property.unitMeasure}
                                      </span>
                                    )}
                                  </div>
                                  }
                                </TableCell>
                                <TableCell className="text-right font-semibold text-primary">{formatPrice(price)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                         <p className="text-xs text-muted-foreground mt-2 italic">
                          *Harga dan luas bersifat estimasi dan dapat bervariasi tergantung posisi/ukuran final.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="lg" className="w-full">
                        {getButtonText()}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                      <DialogHeader>
                        <DialogTitle>Gabung Proyek: {property.name}</DialogTitle>
                        <DialogDescription>
                          Pilih {property.unitName.toLowerCase()} yang Anda minati. Tim kami akan menghubungi Anda untuk proses verifikasi dan pendanaan.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <RadioGroup onValueChange={setSelectedUnit} className="max-h-60 overflow-y-auto pr-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10"></TableHead>
                                <TableHead>{property.unitName}</TableHead>
                                { !isCoBuilding && <TableHead>Luas</TableHead> }
                                <TableHead className="text-right">Estimasi Harga</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {unitPrices.map((price, index) => (
                                <TableRow key={index} className="cursor-pointer" onClick={() => setSelectedUnit((index + 1).toString())}>
                                  <TableCell>
                                    <RadioGroupItem value={(index + 1).toString()} id={`unit-${index + 1}`} />
                                  </TableCell>
                                  <TableCell className="font-medium">{`${property.unitName} ${index + 1}`}</TableCell>
                                  { !isCoBuilding && <TableCell className='text-muted-foreground'>~{getUnitSize(index)}{property.unitMeasure}</TableCell>}
                                  <TableCell className="text-right">{formatPrice(price)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </RadioGroup>
                        <div className='mt-4 space-y-3 rounded-lg border bg-secondary/50 p-4'>
                          <h4 className='font-semibold text-sm'>Langkah Selanjutnya</h4>
                          <ul className='space-y-2 text-xs text-muted-foreground'>
                            <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Verifikasi KYC:</strong> Tim kami akan memverifikasi identitas Anda.</div></li>
                            <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Pendanaan:</strong> Anda akan diundang untuk melakukan pembayaran sesuai jadwal.</div></li>
                            <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Legal & Dokumen:</strong> Proses penandatanganan dokumen kepemilikan bersama.</div></li>
                          </ul>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <DialogClose asChild>
                           <Button onClick={handleJoinProject}>Konfirmasi & Gabung</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

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
                     <Link href={`/profile/${user.id}`} key={user.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50">
                       <Avatar>
                         <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover"/>
                         <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-semibold">{user.name}</p>
                         <p className="text-xs text-muted-foreground">Ingin tinggal di {user.profile.locationPreference}</p>
                       </div>
                     </Link>
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
