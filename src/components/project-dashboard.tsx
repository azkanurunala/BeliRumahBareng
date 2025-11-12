'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { FileText, MessageCircle, Paperclip, Send, Building, BadgeCheck, Home, Square, DraftingCompass, AreaChart, Microscope, Maximize2, MapPin, Users } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { mockProperties } from '@/lib/mock-data';
import ProgressDetailDialog from './progress-detail-dialog';
import DocumentDetailDialog from './document-detail-dialog';
import InstallmentOverview from './installment-overview';
import MonthlyPaymentCard from './monthly-payment-card';
import PaymentHistoryTable from './payment-history-table';
import AddPaymentDialog from './add-payment-dialog';
import { calculateTotalPaymentProgress, formatCurrency } from '@/lib/payment-utils';
import { CreditCard } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FullscreenImageViewer from '@/components/fullscreen-image-viewer';

type ProjectDashboardProps = {
  project: Project;
};

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  const property = mockProperties.find(p => p.id === project.propertyId);
  
  // State for dialogs
  const [selectedProgress, setSelectedProgress] = useState<'kyc' | 'funding' | 'legal' | 'closing' | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  
  // Fullscreen states for each carousel
  const [mainCarouselFullscreen, setMainCarouselFullscreen] = useState({ isOpen: false, index: 0 });
  const [floorPlanFullscreen, setFloorPlanFullscreen] = useState({ isOpen: false, index: 0 });
  const [developmentPlanFullscreen, setDevelopmentPlanFullscreen] = useState({ isOpen: false, index: 0 });
  
  // Carousel API states to track current index
  const [mainCarouselApi, setMainCarouselApi] = useState<CarouselApi>();
  const [floorPlanCarouselApi, setFloorPlanCarouselApi] = useState<CarouselApi>();
  const [developmentPlanCarouselApi, setDevelopmentPlanCarouselApi] = useState<CarouselApi>();
  
  const [mainCarouselCurrent, setMainCarouselCurrent] = useState(0);
  const [floorPlanCarouselCurrent, setFloorPlanCarouselCurrent] = useState(0);
  const [developmentPlanCarouselCurrent, setDevelopmentPlanCarouselCurrent] = useState(0);

  // Track current index for main carousel
  useEffect(() => {
    if (!mainCarouselApi) return;
    setMainCarouselCurrent(mainCarouselApi.selectedScrollSnap());
    mainCarouselApi.on('select', () => {
      setMainCarouselCurrent(mainCarouselApi.selectedScrollSnap());
    });
    return () => {
      mainCarouselApi.off('select');
    };
  }, [mainCarouselApi]);

  // Track current index for floor plan carousel
  useEffect(() => {
    if (!floorPlanCarouselApi) return;
    setFloorPlanCarouselCurrent(floorPlanCarouselApi.selectedScrollSnap());
    floorPlanCarouselApi.on('select', () => {
      setFloorPlanCarouselCurrent(floorPlanCarouselApi.selectedScrollSnap());
    });
    return () => {
      floorPlanCarouselApi.off('select');
    };
  }, [floorPlanCarouselApi]);

  // Track current index for development plan carousel
  useEffect(() => {
    if (!developmentPlanCarouselApi) return;
    setDevelopmentPlanCarouselCurrent(developmentPlanCarouselApi.selectedScrollSnap());
    developmentPlanCarouselApi.on('select', () => {
      setDevelopmentPlanCarouselCurrent(developmentPlanCarouselApi.selectedScrollSnap());
    });
    return () => {
      developmentPlanCarouselApi.off('select');
    };
  }, [developmentPlanCarouselApi]);

  // Generate array of all 16 floor plan images
  const floorPlanImages = Array.from({ length: 16 }, (_, i) => ({
    url: `/images/floor-plans/${String(i + 1).padStart(2, '0')}.png`,
    hint: `floor plan ${i + 1}`
  }));

  // Generate array of development plan images (04.png to 16.png)
  const developmentPlanImages = Array.from({ length: 13 }, (_, i) => ({
    url: `/images/floor-plans/${String(i + 4).padStart(2, '0')}.png`,
    hint: `development plan ${i + 4}`
  }));
  
  const isProjectClosed = project.status === 'closed' || project.status === 'completed';
  const hasActiveInstallments = project.installmentPlans?.some(p => p.status === 'active') || false;
  const isFullyCompleted = isProjectClosed && !hasActiveInstallments;
  const paymentProgress = hasActiveInstallments 
    ? calculateTotalPaymentProgress(project)
    : null;

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);

  // Helper functions for property details
  const isCoBuilding = property?.type === 'co-building';
  const isFlexible = !property?.totalUnits && property?.totalArea;

  const getPropertyTypeDesc = () => {
    if (!property) return '';
    if (isFlexible) return `Tanah dengan pembagian ${property.totalArea}${property.unitMeasure} secara merata`;
    if (isCoBuilding) return `Tanah & Proyek Bangunan ${property.totalUnits} Lantai`;
    return `Lahan Siap Bagi ${property.totalUnits} Kavling`;
  };

  const handleProgressClick = (progressType: 'kyc' | 'funding' | 'legal' | 'closing') => {
    setSelectedProgress(progressType);
  };

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocument(documentId);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Project Header */}
        <Card className="overflow-hidden">
            <div className="relative">
              {property && property.images && property.images.length > 0 ? (
                <Carousel className="w-full" setApi={setMainCarouselApi}>
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-96 w-full group">
                          <Image
                            src={image.url}
                            alt={`${project.propertyName} - gambar ${index + 1}`}
                            fill
                            className="object-cover"
                            data-ai-hint={image.hint}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                            onClick={() => setMainCarouselFullscreen({ isOpen: true, index: mainCarouselCurrent })}
                            aria-label="Open fullscreen"
                          >
                            <Maximize2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              ) : (
                <div className="relative aspect-video">
                  <Image
                    src={project.propertyImageUrl}
                    alt={project.propertyName}
                    fill
                    className="object-cover"
                    data-ai-hint={project.propertyImageHint}
                  />
                </div>
              )}
            </div>
            <CardHeader>
              <Badge variant={isFullyCompleted ? 'default' : hasActiveInstallments ? 'default' : isProjectClosed ? 'default' : 'secondary'}>
                {isFullyCompleted ? 'Selesai' : hasActiveInstallments ? 'Proses Pembayaran' : isProjectClosed ? 'Selesai' : 'Sedang Berjalan'}
              </Badge>
              <CardTitle className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                {project.propertyName}
              </CardTitle>
              <CardDescription className="flex items-center text-lg text-muted-foreground">
                <MapPin className="mr-2 h-5 w-5" />
                {property?.location || 'Lokasi'}
              </CardDescription>
              {/* Gradient divider */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
            </CardHeader>
            <CardContent>
              <p className="text-base">{property?.description || 'Deskripsi properti'}</p>
              
              {/* Detail Properti Accordion */}
              {property && (
                <Accordion type="single" collapsible className="w-full mt-6" defaultValue="item-1">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <h3 className="text-lg font-semibold flex items-center">
                        <Building className="mr-2 h-5 w-5" /> Detail Properti
                      </h3>
                    </AccordionTrigger>
                    <AccordionContent className="grid grid-cols-2 gap-4 pt-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-primary" />
                        <p><strong>Tipe Proyek:</strong> {getPropertyTypeDesc()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        <p><strong>Sertifikat Induk:</strong> SHM</p>
                      </div>
                      {property.totalUnits && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <p><strong>Kapasitas Grup:</strong> {property.totalUnits} {property.unitName}</p>
                        </div>
                      )}
                      {!isCoBuilding && property.unitSize && (
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4 text-primary" />
                          <p><strong>Luas per Kavling:</strong> ~{property.unitSize}{property.unitMeasure}</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
        </Card>

        {/* Main Content Tabs - Only show tabs if project is closed with installments */}
        {isProjectClosed && project.installmentPlans && project.installmentPlans.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Proyek</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payment" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                  <TabsTrigger value="documents">Dokumen & Perencanaan</TabsTrigger>
                </TabsList>
                <TabsContent value="payment" className="space-y-6 mt-6">
                  {/* Monthly Payment Cards */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                      Cicilan per Unit
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {project.installmentPlans.map((plan) => {
                        const user = project.members.find(m => m.id === plan.userId);
                        if (!user) return null;
                        return (
                          <MonthlyPaymentCard
                            key={plan.id}
                            plan={plan}
                            user={user}
                            property={property}
                            onAddPayment={() => setSelectedPlanForPayment(plan.id)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <PaymentHistoryTable
                    payments={project.installmentPlans.flatMap(plan => plan.payments)}
                    members={project.members}
                    property={property}
                    onViewReceipt={(payment) => {
                      if (payment.receiptUrl) {
                        window.open(payment.receiptUrl, '_blank');
                      }
                    }}
                  />
                </TabsContent>
                <TabsContent value="documents" className="space-y-6 mt-6">
                  {/* Document Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Dokumen</CardTitle>
                      <CardDescription>
                        Kelola dan tanda tangani dokumen legal bersama.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nama Dokumen</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.documents.map((doc) => (
                            <TableRow 
                              key={doc.id}
                              className="cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => handleDocumentClick(doc.id)}
                            >
                              <TableCell className="font-medium flex items-center gap-2"><FileText size={16} /> {doc.name}</TableCell>
                              <TableCell>
                                <Badge variant={doc.status === 'Terverifikasi' ? 'default' : doc.status === 'Tertanda' ? 'secondary' : 'outline'}>
                                  {doc.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {doc.status === 'Menunggu' && <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDocumentClick(doc.id); }}>Tanda Tangan</Button>}
                                {doc.status !== 'Menunggu' && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDocumentClick(doc.id); }}>Lihat</Button>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Perencanaan & Detail Proyek */}
                  {property?.planningInfo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                          Perencanaan & Detail Proyek
                        </CardTitle>
                        {/* Gradient divider */}
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="plan">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="plan">
                              <DraftingCompass className="mr-2 h-4 w-4" />Denah Lokasi
                            </TabsTrigger>
                            <TabsTrigger value="dev">
                              <AreaChart className="mr-2 h-4 w-4" />Rencana Pengembangan
                            </TabsTrigger>
                            <TabsTrigger value="env">
                              <Microscope className="mr-2 h-4 w-4" />Analisis Lingkungan
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="plan" className="mt-4">
                            <div className="relative">
                              <Carousel className="w-full" setApi={setFloorPlanCarouselApi}>
                                <CarouselContent>
                                  {floorPlanImages.map((image, index) => (
                                    <CarouselItem key={index}>
                                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border group">
                                        <Image
                                          src={image.url}
                                          alt={`Denah Lokasi ${index + 1}`}
                                          fill
                                          className="object-contain"
                                          data-ai-hint={image.hint}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                                          onClick={() => setFloorPlanFullscreen({ isOpen: true, index: floorPlanCarouselCurrent })}
                                          aria-label="Open fullscreen"
                                        >
                                          <Maximize2 className="h-5 w-5" />
                                        </Button>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4" />
                                <CarouselNext className="right-4" />
                              </Carousel>
                            </div>
                          </TabsContent>
                          <TabsContent value="dev" className="mt-4">
                            <div className="relative">
                              <Carousel className="w-full" setApi={setDevelopmentPlanCarouselApi}>
                                <CarouselContent>
                                  {developmentPlanImages.map((image, index) => (
                                    <CarouselItem key={index}>
                                      <div className="relative aspect-video w-full rounded-lg overflow-hidden border group">
                                        <Image
                                          src={image.url}
                                          alt={`Rencana Pengembangan ${index + 4}`}
                                          fill
                                          className="object-contain"
                                          data-ai-hint={image.hint}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                                          onClick={() => setDevelopmentPlanFullscreen({ isOpen: true, index: developmentPlanCarouselCurrent })}
                                          aria-label="Open fullscreen"
                                        >
                                          <Maximize2 className="h-5 w-5" />
                                        </Button>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4" />
                                <CarouselNext className="right-4" />
                              </Carousel>
                            </div>
                            {property.planningInfo.developmentPlan && (
                              <div className="mt-4 text-sm text-muted-foreground">
                                <p>{property.planningInfo.developmentPlan}</p>
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="env" className="mt-4 text-sm text-muted-foreground">
                            <p>{property.planningInfo.environmentalAnalysis}</p>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Document Management - Show directly if project is active */}
            <Card>
              <CardHeader>
                <CardTitle>Dokumen</CardTitle>
                <CardDescription>
                  Kelola dan tanda tangani dokumen legal bersama.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Dokumen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.documents.map((doc) => (
                      <TableRow 
                        key={doc.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleDocumentClick(doc.id)}
                      >
                        <TableCell className="font-medium flex items-center gap-2"><FileText size={16} /> {doc.name}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === 'Terverifikasi' ? 'default' : doc.status === 'Tertanda' ? 'secondary' : 'outline'}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.status === 'Menunggu' && <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDocumentClick(doc.id); }}>Tanda Tangan</Button>}
                          {doc.status !== 'Menunggu' && <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDocumentClick(doc.id); }}>Lihat</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Perencanaan & Detail Proyek - Show directly if project is active */}
            {property?.planningInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                    Perencanaan & Detail Proyek
                  </CardTitle>
                  {/* Gradient divider */}
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="plan">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="plan">
                        <DraftingCompass className="mr-2 h-4 w-4" />Denah Lokasi
                      </TabsTrigger>
                      <TabsTrigger value="dev">
                        <AreaChart className="mr-2 h-4 w-4" />Rencana Pengembangan
                      </TabsTrigger>
                      <TabsTrigger value="env">
                        <Microscope className="mr-2 h-4 w-4" />Analisis Lingkungan
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="plan" className="mt-4">
                      <div className="relative">
                        <Carousel className="w-full" setApi={setFloorPlanCarouselApi}>
                          <CarouselContent>
                            {floorPlanImages.map((image, index) => (
                              <CarouselItem key={index}>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border group">
                                  <Image
                                    src={image.url}
                                    alt={`Denah Lokasi ${index + 1}`}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={image.hint}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                                    onClick={() => setFloorPlanFullscreen({ isOpen: true, index: floorPlanCarouselCurrent })}
                                    aria-label="Open fullscreen"
                                  >
                                    <Maximize2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-4" />
                          <CarouselNext className="right-4" />
                        </Carousel>
                      </div>
                    </TabsContent>
                    <TabsContent value="dev" className="mt-4">
                      <div className="relative">
                        <Carousel className="w-full" setApi={setDevelopmentPlanCarouselApi}>
                          <CarouselContent>
                            {developmentPlanImages.map((image, index) => (
                              <CarouselItem key={index}>
                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border group">
                                  <Image
                                    src={image.url}
                                    alt={`Rencana Pengembangan ${index + 4}`}
                                    fill
                                    className="object-contain"
                                    data-ai-hint={image.hint}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                                    onClick={() => setDevelopmentPlanFullscreen({ isOpen: true, index: developmentPlanCarouselCurrent })}
                                    aria-label="Open fullscreen"
                                  >
                                    <Maximize2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-4" />
                          <CarouselNext className="right-4" />
                        </Carousel>
                      </div>
                      {property.planningInfo.developmentPlan && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          <p>{property.planningInfo.developmentPlan}</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="env" className="mt-4 text-sm text-muted-foreground">
                      <p>{property.planningInfo.environmentalAnalysis}</p>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </>
        )}

      </div>
      <div className="space-y-6 lg:col-span-1">
        {/* Project Progress - Moved to sidebar if project is active */}
        {!isProjectClosed && (
          <Card>
            <CardHeader>
              <CardTitle>Kemajuan Proyek</CardTitle>
              <CardDescription>Status keseluruhan dari proyek co-buy Anda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="space-y-2 cursor-pointer p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                onClick={() => handleProgressClick('kyc')}
              >
                <div className='flex justify-between text-sm'>
                  <p className="group-hover:text-primary transition-colors font-medium">Verifikasi KYC</p>
                  <p className='font-medium'>{project.progress.kyc}%</p>
                </div>
                <Progress value={project.progress.kyc} aria-label={`${project.progress.kyc}% KYC terverifikasi`} />
              </div>
              <div 
                className="space-y-2 cursor-pointer p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                onClick={() => handleProgressClick('funding')}
              >
                <div className='flex justify-between text-sm'>
                  <p className="group-hover:text-primary transition-colors font-medium">Pendanaan Grup</p>
                  <p className='font-medium'>{project.progress.funding}%</p>
                </div>
                <Progress value={project.progress.funding} aria-label={`${project.progress.funding}% didanai`} />
              </div>
              <div 
                className="space-y-2 cursor-pointer p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                onClick={() => handleProgressClick('legal')}
              >
                <div className='flex justify-between text-sm'>
                  <p className="group-hover:text-primary transition-colors font-medium">Legal & Dokumentasi</p>
                  <p className='font-medium'>{project.progress.legal}%</p>
                </div>
                <Progress value={project.progress.legal} aria-label={`${project.progress.legal}% legal selesai`} />
              </div>
               <div 
                className="space-y-2 cursor-pointer p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                onClick={() => handleProgressClick('closing')}
              >
                <div className='flex justify-between text-sm'>
                  <p className="group-hover:text-primary transition-colors font-medium">Penutupan</p>
                  <p className='font-medium'>{project.progress.closing}%</p>
                </div>
                <Progress value={project.progress.closing} aria-label={`${project.progress.closing}% selesai`} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Progress - Moved to sidebar if there are active installments */}
        {hasActiveInstallments && paymentProgress && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle>Progress Pembayaran</CardTitle>
              </div>
              <CardDescription>
                Ringkasan pembayaran cicilan untuk semua unit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Pembayaran</span>
                  <span className="font-bold text-lg text-primary">{paymentProgress.percentage}%</span>
                </div>
                <Progress value={paymentProgress.percentage} className="h-3" />
                <div className="flex flex-col gap-1 text-xs pt-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Dibayar:</span>
                    <span>{formatCurrency(paymentProgress.paid)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total:</span>
                    <span>{formatCurrency(paymentProgress.total)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t">
                    <span>Sisa:</span>
                    <span>{formatCurrency(paymentProgress.total - paymentProgress.paid)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Installment Overview - Moved to sidebar if project is closed */}
        {isProjectClosed && project.installmentPlans && project.installmentPlans.length > 0 && (
          <InstallmentOverview plans={project.installmentPlans} />
        )}

        {/* Project Members */}
        <Card>
          <CardHeader>
            <CardTitle>Alokasi Unit Anggota</CardTitle>
            <CardDescription>{project.members.length} orang di grup ini</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {project.members.map((member) => {
                    const assignment = project.unitAssignments.find(a => a.userId === member.id);
                    return (
                       <TableRow key={member.id}>
                         <TableCell>
                            <Link href={`/profile/${member.id}`} className="flex items-center gap-2 rounded-lg transition-colors hover:bg-muted/50">
                                <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatarUrl} alt={member.name} data-ai-hint={member.avatarHint} className="object-cover" />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">{member.name}</span>
                            </Link>
                         </TableCell>
                          <TableCell className="text-sm">
                            {assignment ? (
                              <div className="flex flex-col">
                                <span className='font-semibold'>{property?.unitName} {assignment.unitId}</span>
                                <span className='text-xs text-muted-foreground'>
                                  {assignment.size ? `~${assignment.size}${property?.unitMeasure}` : formatPrice(assignment.price)}
                                </span>
                              </div>
                            ) : (
                              <span className='text-muted-foreground italic'>Belum memilih</span>
                            )}
                          </TableCell>
                       </TableRow>
                    );
                   })}
                </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>

      {/* Progress Detail Dialogs */}
      {selectedProgress && project.progressDetails[selectedProgress] && (
        <ProgressDetailDialog
          open={selectedProgress !== null}
          onOpenChange={(open) => !open && setSelectedProgress(null)}
          progressDetail={project.progressDetails[selectedProgress]}
          members={project.members}
        />
      )}

      {/* Document Detail Dialogs */}
      {selectedDocument && (
        <DocumentDetailDialog
          open={selectedDocument !== null}
          onOpenChange={(open) => !open && setSelectedDocument(null)}
          document={project.documents.find(d => d.id === selectedDocument)!}
          members={project.members}
        />
      )}

      {/* Add Payment Dialog */}
      {selectedPlanForPayment && project.installmentPlans && (
        <AddPaymentDialog
          open={selectedPlanForPayment !== null}
          onOpenChange={(open) => !open && setSelectedPlanForPayment(null)}
          plan={project.installmentPlans.find(p => p.id === selectedPlanForPayment)!}
          onSubmit={(paymentData) => {
            // Handle payment submission
            console.log('Payment submitted:', paymentData);
            // In real app, this would call an API to save the payment
          }}
        />
      )}

      {/* Fullscreen Image Viewers */}
      {property && property.images && property.images.length > 0 && (
        <FullscreenImageViewer
          images={property.images.map(img => ({ url: img.url, alt: `${project.propertyName} - gambar`, hint: img.hint }))}
          initialIndex={mainCarouselFullscreen.index}
          isOpen={mainCarouselFullscreen.isOpen}
          onClose={() => setMainCarouselFullscreen({ isOpen: false, index: 0 })}
        />
      )}
      
      <FullscreenImageViewer
        images={floorPlanImages.map(img => ({ url: img.url, alt: `Denah Lokasi`, hint: img.hint }))}
        initialIndex={floorPlanFullscreen.index}
        isOpen={floorPlanFullscreen.isOpen}
        onClose={() => setFloorPlanFullscreen({ isOpen: false, index: 0 })}
      />
      
      <FullscreenImageViewer
        images={developmentPlanImages.map(img => ({ url: img.url, alt: `Rencana Pengembangan`, hint: img.hint }))}
        initialIndex={developmentPlanFullscreen.index}
        isOpen={developmentPlanFullscreen.isOpen}
        onClose={() => setDevelopmentPlanFullscreen({ isOpen: false, index: 0 })}
      />
    </div>
  );
}
