'use client';

import { useState, useEffect } from 'react';
import type { Property } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Building, Users, BadgeCheck, Home, Square, ArrowLeft, AreaChart, DraftingCompass, Microscope, CheckCircle, Info, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useUserData } from '@/contexts/user-data-context';
import { useAdminData } from '@/contexts/admin-data-context';
import FullscreenImageViewer from '@/components/fullscreen-image-viewer';
import { Heart, Loader2 } from 'lucide-react';
import { normalizeUnitMeasure } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function PropertyDetailClient({ property }: { property: Property }) {
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isFirstHome, setIsFirstHome] = useState<boolean | null>(null);
  const [willOccupy, setWillOccupy] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { addInterest, addToWatchlist, removeFromWatchlist, isInWatchlist } = useUserData();
  const { users } = useAdminData();
  
  const isWatched = isInWatchlist(property.id);

  // Auto-fill email and phoneNumber from user data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [isAuthenticated, user]);

  // Fullscreen states for each carousel
  const [mainCarouselFullscreen, setMainCarouselFullscreen] = useState({ isOpen: false, index: 0 });
  const [floorPlanFullscreen, setFloorPlanFullscreen] = useState({ isOpen: false, index: 0 });
  
  // Carousel API states to track current index
  const [mainCarouselApi, setMainCarouselApi] = useState<CarouselApi>();
  const [floorPlanCarouselApi, setFloorPlanCarouselApi] = useState<CarouselApi>();
  
  const [mainCarouselCurrent, setMainCarouselCurrent] = useState(0);
  const [floorPlanCarouselCurrent, setFloorPlanCarouselCurrent] = useState(0);

  // Track current index for main carousel
  useEffect(() => {
    if (!mainCarouselApi) return;

    setMainCarouselCurrent(mainCarouselApi.selectedScrollSnap());

    const onSelect = () => {
      setMainCarouselCurrent(mainCarouselApi.selectedScrollSnap());
    };

    mainCarouselApi.on('select', onSelect);

    return () => {
      mainCarouselApi.off('select', onSelect);
    };
  }, [mainCarouselApi]);

  // Track current index for floor plan carousel
  useEffect(() => {
    if (!floorPlanCarouselApi) return;

    setFloorPlanCarouselCurrent(floorPlanCarouselApi.selectedScrollSnap());

    const onSelect = () => {
      setFloorPlanCarouselCurrent(floorPlanCarouselApi.selectedScrollSnap());
    };

    floorPlanCarouselApi.on('select', onSelect);

    return () => {
      floorPlanCarouselApi.off('select', onSelect);
    };
  }, [floorPlanCarouselApi]);

  // Use actual site plan from property data
  const floorPlanImages = property.planningInfo?.sitePlanUrl 
    ? [{ url: property.planningInfo.sitePlanUrl, hint: property.planningInfo.sitePlanHint || 'Denah lokasi' }]
    : [];

  const isCoBuilding = property.type === 'co-building';
  const isFlexible = !property.totalUnits && property.totalArea;

  // Use stored unitPrices if available (for co-owning with manual prices), otherwise calculate
  const unitPrices = isFlexible 
    ? [] 
    : (property.unitPrices && property.unitPrices.length > 0 && !isCoBuilding)
      ? property.unitPrices.map(plot => plot.price)
      : Array.from({ length: property.totalUnits! }, (_, i) => {
          let weight;
          const floorWeight = isCoBuilding ? (property.totalUnits! - i -1) * 0.05 : (i * 0.02);

          weight = 1.0 + floorWeight;
          
          if (isCoBuilding && i === 0) {
            weight = 1.0 + ((property.totalUnits! - 1) * 0.05) + 0.10;
          } else if(isCoBuilding) {
             weight = 1.0 + (property.totalUnits! - 1 - i) * 0.05;
          } else {
             weight = 1.0 + (i * 0.02);
          }
          
          if(isCoBuilding) {
              const basePricePerUnit = property.price / property.totalUnits!;
              const premium = (property.totalUnits! - 1 - i) * 0.05;
              return basePricePerUnit * (1 + premium);

          }

          return (property.price / property.totalUnits!) * weight;
        });


  const formattedTotalPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(property.price);
  
  const formattedPricePerMeter = isFlexible ? new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(property.price / property.totalArea!) : '';

  const formatPrice = (price: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
  
  // State for interested users
  const [interestedUsers, setInterestedUsers] = useState<any[]>([]);
  const [isLoadingInterestedUsers, setIsLoadingInterestedUsers] = useState(true);

  // Fetch interested users from property interests
  useEffect(() => {
    const fetchInterestedUsers = async () => {
      try {
        setIsLoadingInterestedUsers(true);
        const response = await apiClient.get('/property-interests', {
          params: {
            propertyId: property.id,
            status: 'approved',
            limit: 10, // Get more to have options after filtering
          },
        });

        if (response.success && response.data) {
          // Extract unique users from interests
          const userMap = new Map();
          response.data.forEach((interest: any) => {
            if (interest.user && !userMap.has(interest.userId)) {
              userMap.set(interest.userId, {
                id: interest.userId,
                name: interest.user.name,
                avatarUrl: interest.user.avatarUrl,
                avatarHint: interest.user.avatarHint,
                profile: {
                  locationPreference: interest.user.profile?.locationPreference || 'Tidak disebutkan',
                },
              });
            }
          });

          // Filter out current user and limit to 3
          const users = Array.from(userMap.values())
            .filter((u: any) => u.id !== user?.id)
            .slice(0, 3);

          setInterestedUsers(users);
        } else {
          setInterestedUsers([]);
        }
      } catch (error) {
        console.error('Error fetching interested users:', error);
        setInterestedUsers([]);
      } finally {
        setIsLoadingInterestedUsers(false);
      }
    };

    fetchInterestedUsers();
  }, [property.id, user?.id]);

  const getBadgeText = () => {
    if (isFlexible) return 'Patungan Fleksibel';
    return isCoBuilding ? 'Patungan Bangunan' : 'Patungan Lahan';
  };

  const getTitle = () => {
    if (isFlexible) return 'Gabung Grup Fleksibel';
    return isCoBuilding ? 'Gabung Grup Bangunan' : 'Gabung Grup Patungan Lahan';
  };

  const getDescription = () => {
    if (isFlexible) return `Miliki sebagian tanah dengan pembagian luas berdasarkan jumlah investor final.`;
    return isCoBuilding 
      ? `Bangun dan miliki satu ${property.unitName.toLowerCase()} di properti ini.`
      : `Miliki satu ${property.unitName.toLowerCase()} tanah di lokasi ini.`;
  };

  const getButtonText = () => {
    if (isFlexible) return 'Gabung Grup Fleksibel';
    return isCoBuilding ? 'Gabung Grup Bangunan' : 'Gabung Grup Patungan';
  };
  
  const getPropertyTypeDesc = () => {
     if (isFlexible) return `Tanah dengan pembagian ${property.totalArea} ${normalizeUnitMeasure(property.unitMeasure)} secara merata`;
     if (isCoBuilding) return `Tanah & Proyek Bangunan ${property.totalUnits} Lantai`;
     return `Lahan Siap Bagi ${property.totalUnits} Kavling`;
  }

  const getUnitSize = (index: number) => {
    if (isCoBuilding || isFlexible) return null;
    // Use stored plot size if available, otherwise calculate from average
    if (property.unitPrices && property.unitPrices.length > index) {
      return property.unitPrices[index].size;
    }
    if (!property.unitSize) return null;
    const baseSize = property.unitSize;
    const variation = (index - Math.floor(property.totalUnits! / 2)) * 2;
    return baseSize + variation;
  }
  
  const handleJoinProject = () => {
    if (!isAuthenticated || !user) {
      toast({
        variant: "destructive",
        title: "Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk bergabung dengan proyek.",
      });
      return;
    }

    // Validasi: jika property memiliki totalUnits (bukan flexible), maka selectedUnit wajib dipilih
    if (!isFlexible && property.totalUnits && property.totalUnits > 0 && !selectedUnit) {
      toast({
        variant: "destructive",
        title: "Pilihan Dibutuhkan",
        description: `Silakan pilih ${property.unitName} yang Anda inginkan.`,
      });
      return;
    }

    // Validate email and phoneNumber
    if (!email || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Email Diperlukan",
        description: "Silakan masukkan email Anda.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Email Tidak Valid",
        description: "Silakan masukkan email yang valid.",
      });
      return;
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Nomor Telepon Diperlukan",
        description: "Silakan masukkan nomor telepon/WhatsApp Anda.",
      });
      return;
    }
    
    // Create interest
    addInterest({
      propertyId: property.id,
      userId: user.id,
      unitId: !isFlexible && selectedUnit ? parseInt(selectedUnit) : undefined,
      unitSize: isFlexible ? undefined : undefined, // For flexible, will be determined later
      isFirstHome: isFirstHome ?? false,
      willOccupy: willOccupy ?? false,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
    });
    
    toast({
      title: "Berhasil Bergabung",
      description: isFlexible
        ? "Anda telah menyatakan minat untuk bergabung. Tim kami akan segera menghubungi Anda."
        : `Anda telah memilih ${property.unitName} ${selectedUnit}. Tim kami akan segera menghubungi Anda untuk langkah selanjutnya.`,
    });
  };

  return (
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
              <div className="relative">
                <Carousel className="w-full" setApi={setMainCarouselApi}>
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative h-96 w-full group">
                          <Image
                            src={image.url}
                            alt={`${property.name} - gambar ${index + 1}`}
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
              </div>
              <CardHeader>
                <Badge className="mb-2 w-fit bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0 shadow-sm">
                  {getBadgeText()}
                </Badge>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {property.name}
                </CardTitle>
                <CardDescription className="flex items-center text-lg text-muted-foreground">
                  <MapPin className="mr-2 h-5 w-5" />
                  {property.location}
                </CardDescription>
                {/* Gradient divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
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
                      {property.totalUnits && (
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p><strong>Kapasitas Grup:</strong> {property.totalUnits} {property.unitName}</p></div>
                      )}
                      {isCoBuilding && property.totalArea && (
                        <div className="flex items-center gap-2"><Square className="h-4 w-4 text-primary" /><p><strong>Luas Lahan:</strong> {property.totalArea} {normalizeUnitMeasure(property.unitMeasure)}</p></div>
                      )}
                      {isCoBuilding && property.buildingArea && (
                        <div className="flex items-center gap-2"><Square className="h-4 w-4 text-primary" /><p><strong>Total Luas Bangunan:</strong> {property.buildingArea} {normalizeUnitMeasure(property.unitMeasure)}</p></div>
                      )}
                      {!isCoBuilding && property.unitSize && (
                         <div className="flex items-center gap-2"><Square className="h-4 w-4 text-primary" /><p><strong>Luas per Kavling:</strong> ~{property.unitSize} {normalizeUnitMeasure(property.unitMeasure)}</p></div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            {property.planningInfo && (
              <Card className="mt-8">
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
                      <TabsTrigger value="plan"><DraftingCompass className="mr-2 h-4 w-4" />Denah Lokasi</TabsTrigger>
                      <TabsTrigger value="dev"><AreaChart className="mr-2 h-4 w-4" />Rencana Pengembangan</TabsTrigger>
                      <TabsTrigger value="env"><Microscope className="mr-2 h-4 w-4" />Analisis Lingkungan</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plan" className="mt-4">
                      {floorPlanImages.length > 0 ? (
                        <div className="relative">
                          <Carousel className="w-full" setApi={setFloorPlanCarouselApi}>
                            <CarouselContent>
                              {floorPlanImages.map((image, index) => (
                                <CarouselItem key={index}>
                                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border group">
                                    <Image
                                      src={image.url}
                                      alt={image.hint || 'Denah Lokasi'}
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
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Denah lokasi belum tersedia</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="dev" className="mt-4">
                      {property.planningInfo.developmentPlan ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          <p>{property.planningInfo.developmentPlan}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Rencana pengembangan belum tersedia</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="env" className="mt-4">
                      {property.planningInfo.environmentalAnalysis ? (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          <p>{property.planningInfo.environmentalAnalysis}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Analisis lingkungan belum tersedia</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  {getTitle()}
                </CardTitle>
                <CardDescription>
                  {getDescription()}
                </CardDescription>
                {/* Gradient divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='border-b border-primary/20 pb-2 text-center'>
                  <p className="text-sm text-muted-foreground">{isFlexible ? 'Total Luas Tanah' : 'Total Nilai Proyek'}</p>
                  <p className="text-2xl font-bold">{isFlexible ? `${property.totalArea} ${normalizeUnitMeasure(property.unitMeasure)}` : formattedTotalPrice}</p>
                   {isFlexible && (
                      <>
                          <p className="text-sm text-muted-foreground mt-2">Harga Tanah per {normalizeUnitMeasure(property.unitMeasure)}</p>
                          <p className="text-xl font-bold text-primary">{formattedPricePerMeter}</p>
                      </>
                  )}
                </div>
                
                {!isFlexible ? (
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
                                        ~{getUnitSize(index)} {normalizeUnitMeasure(property.unitMeasure)}
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
                ) : (
                  <div className='rounded-lg border bg-blue-50 p-4 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'>
                      <div className='flex items-start gap-3'>
                          <Info size={20} className='mt-0.5 shrink-0' />
                          <div>
                              <h4 className='font-semibold'>Model Pembagian Fleksibel</h4>
                              <p className='text-xs mt-1'>Total biaya dan luas tanah yang Anda dapatkan akan dihitung secara proporsional berdasarkan jumlah total investor yang bergabung di akhir periode pendanaan.</p>
                          </div>
                      </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant={isWatched ? "default" : "outline"}
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      if (!isAuthenticated || !user) {
                        toast({
                          variant: "destructive",
                          title: "Login Diperlukan",
                          description: "Silakan login terlebih dahulu untuk menyimpan properti ke watchlist.",
                        });
                        return;
                      }
                      
                      if (isWatched) {
                        removeFromWatchlist(property.id);
                        toast({
                          title: "Dihapus dari Watchlist",
                          description: "Properti telah dihapus dari watchlist Anda.",
                        });
                      } else {
                        addToWatchlist(property.id);
                        toast({
                          title: "Ditambahkan ke Watchlist",
                          description: "Properti telah disimpan ke watchlist Anda.",
                        });
                      }
                    }}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isWatched ? 'fill-current' : ''}`} />
                    {isWatched ? 'Di Watchlist' : 'Simpan ke Watchlist'}
                  </Button>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      {getButtonText()}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] h-[90vh] max-w-none flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Gabung Proyek: {property.name}</DialogTitle>
                      <DialogDescription>
                        {isFlexible 
                          ? 'Konfirmasi minat Anda untuk bergabung. Tim kami akan menghubungi Anda untuk proses selanjutnya.'
                          : `Pilih ${property.unitName.toLowerCase()} yang Anda minati. Tim kami akan menghubungi Anda untuk proses verifikasi dan pendanaan.`
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0">
                      {!isFlexible && property.totalUnits && property.totalUnits > 0 && (
                          <div className="space-y-3">
                            <Label className="text-base font-semibold">Pilih {property.unitName} yang Anda minati</Label>
                            <RadioGroup onValueChange={setSelectedUnit} value={selectedUnit || undefined} className="max-h-60 overflow-y-auto pr-4">
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
                                    { !isCoBuilding && <TableCell className='text-muted-foreground'>~{getUnitSize(index)} {normalizeUnitMeasure(property.unitMeasure)}</TableCell>}
                                    <TableCell className="text-right">{formatPrice(price)}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                            </RadioGroup>
                          </div>
                      )}
                      
                      <div className='mt-4 space-y-4 rounded-lg border p-4'>
                        <h4 className='font-semibold text-sm mb-3'>Informasi Kontak</h4>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="nama@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Nomor Telepon/WhatsApp *</Label>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              placeholder="+62 812-3456-7890"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className='mt-4 space-y-4 rounded-lg border p-4'>
                        <h4 className='font-semibold text-sm mb-3'>Informasi Tambahan</h4>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Apakah ini untuk rumah pertama Anda?
                            </Label>
                            <RadioGroup
                              value={isFirstHome === null ? undefined : (isFirstHome ? "yes" : "no")}
                              onValueChange={(value) => setIsFirstHome(value === "yes")}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="isFirstHome-yes" />
                                <Label htmlFor="isFirstHome-yes" className="cursor-pointer">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="isFirstHome-no" />
                                <Label htmlFor="isFirstHome-no" className="cursor-pointer">Tidak</Label>
                              </div>
                            </RadioGroup>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Apakah rumah ini akan Anda tempati sendiri?
                            </Label>
                            <RadioGroup
                              value={willOccupy === null ? undefined : (willOccupy ? "yes" : "no")}
                              onValueChange={(value) => setWillOccupy(value === "yes")}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="willOccupy-yes" />
                                <Label htmlFor="willOccupy-yes" className="cursor-pointer">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="willOccupy-no" />
                                <Label htmlFor="willOccupy-no" className="cursor-pointer">Tidak</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>

                      <div className='mt-4 space-y-3 rounded-lg border bg-secondary/50 p-4'>
                        <h4 className='font-semibold text-sm'>Langkah Selanjutnya</h4>
                        <ul className='space-y-2 text-xs text-muted-foreground'>
                          <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Verifikasi KYC:</strong> Tim kami akan memverifikasi identitas Anda.</div></li>
                          <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Pendanaan:</strong> Anda akan diundang untuk melakukan pembayaran sesuai jadwal.</div></li>
                          <li className='flex items-start gap-2'><CheckCircle size={14} className='text-green-500 mt-0.5' /><div><strong>Legal & Dokumen:</strong> Proses penandatanganan dokumen kepemilikan bersama.</div></li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter className="flex-shrink-0">
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
                {isLoadingInterestedUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : interestedUsers.length > 0 ? (
                  interestedUsers.map(user => (
                    <Link href={`/profile/${user.id}`} key={user.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.avatarHint} className="object-cover"/>
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground">Ingin tinggal di {user.profile?.locationPreference || 'Tidak disebutkan'}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada anggota yang tertarik
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewers */}
      <FullscreenImageViewer
        images={property.images.map(img => ({ url: img.url, alt: `${property.name} - gambar`, hint: img.hint }))}
        initialIndex={mainCarouselFullscreen.index}
        isOpen={mainCarouselFullscreen.isOpen}
        onClose={() => setMainCarouselFullscreen({ isOpen: false, index: 0 })}
      />

      <FullscreenImageViewer
        images={floorPlanImages.map(img => ({ url: img.url, alt: `Denah Lokasi`, hint: img.hint }))}
        initialIndex={floorPlanFullscreen.index}
        isOpen={floorPlanFullscreen.isOpen}
        onClose={() => setFloorPlanFullscreen({ isOpen: false, index: 0 })}
      />
    </main>
  );
}
