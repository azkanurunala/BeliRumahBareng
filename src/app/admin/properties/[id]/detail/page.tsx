'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft, Edit, Building2, MapPin, DollarSign, Home, Square, FileText, Image as ImageIcon, BadgeCheck, Users, Table as TableIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/payment-utils';
import Image from 'next/image';
import { Breadcrumb } from '@/components/admin/breadcrumb';

// Helper function to format numbers with thousand separators (Indonesian format)
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getProperty } = useAdminData();
  
  const property = getProperty(id);
  
  if (!property) {
    notFound();
  }

  const isCoBuilding = property.type === 'co-building';
  const isFlexible = !property.totalUnits && property.totalArea;
  
  const getBadgeText = () => {
    if (isFlexible) return 'Patungan Fleksibel';
    return isCoBuilding ? 'Patungan Bangunan' : 'Patungan Lahan';
  };

  const getPropertyTypeDesc = () => {
    if (isFlexible) return `Tanah dengan pembagian ${property.totalArea}${property.unitMeasure} secara merata`;
    if (isCoBuilding) return `Tanah & Proyek Bangunan ${property.totalUnits} Lantai`;
    return `Lahan Siap Bagi ${property.totalUnits} Kavling`;
  };

  const formattedPricePerMeter = isFlexible && property.totalArea ? formatCurrency(property.price / property.totalArea) : '';

  // Calculate total from unitPrices if available
  const unitPricesTotal = property.unitPrices && property.unitPrices.length > 0
    ? property.unitPrices.reduce((sum, plot) => sum + (plot.price || 0), 0)
    : null;
  
  const hasPriceDiscrepancy = unitPricesTotal !== null && Math.abs(unitPricesTotal - property.price) > 0.01;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
            <p className="text-muted-foreground">
              Detail informasi properti
            </p>
            <div className="mt-2">
              <Breadcrumb items={[
                { label: 'Properties', href: '/admin/properties' },
                { label: property.name }
              ]} />
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin/properties/${id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </Link>
        </Button>
      </div>

      {/* Badge and Title */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-gradient-to-r from-primary/90 to-primary/70 text-white border-0 shadow-sm">
              {getBadgeText()}
            </Badge>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            {property.name}
          </CardTitle>
          <CardDescription className="flex items-center text-lg text-muted-foreground mt-2">
            <MapPin className="mr-2 h-5 w-5" />
            {property.location}
          </CardDescription>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-4" />
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gambar Properti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {property.images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={image.url}
                    alt={`${property.name} - ${index + 1}`}
                    fill
                    className="object-cover"
                    data-ai-hint={image.hint}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{isFlexible ? 'Total Nilai Proyek' : 'Harga'}</span>
              </div>
              <p className="font-bold text-lg">{formatCurrency(property.price)}</p>
              {isFlexible && formattedPricePerMeter && (
                <>
                  <p className="text-sm text-muted-foreground mt-1">Harga Tanah per {property.unitMeasure}</p>
                  <p className="font-bold text-primary">{formattedPricePerMeter}</p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-4 w-4 text-primary" />
                <span>Tipe Proyek:</span>
              </div>
              <p className="font-medium">{getPropertyTypeDesc()}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span>Sertifikat Induk:</span>
              </div>
              <p className="font-medium">SHM</p>
            </div>

            {property.totalUnits && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Kapasitas Grup:</span>
                </div>
                <p className="font-medium">{property.totalUnits} {property.unitName}</p>
              </div>
            )}

            {!isCoBuilding && property.unitSize && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Square className="h-4 w-4 text-primary" />
                  <span>Luas per Kavling:</span>
                </div>
                <p className="font-medium">
                  {(() => {
                    // If unitPrices exists and has data, use actual data
                    if (property.unitPrices && property.unitPrices.length > 0) {
                      const sizes = property.unitPrices
                        .map(plot => plot.size || 0)
                        .filter(size => size > 0);
                      
                      if (sizes.length > 0) {
                        const minSize = Math.min(...sizes);
                        const maxSize = Math.max(...sizes);
                        
                        // If all sizes are the same, show exact value
                        if (minSize === maxSize) {
                          return `${formatNumber(minSize)}${property.unitMeasure || 'm²'}`;
                        }
                        
                        // If sizes vary, show range
                        return `${formatNumber(minSize)}-${formatNumber(maxSize)}${property.unitMeasure || 'm²'}`;
                      }
                    }
                    
                    // Fallback to approximation if unitPrices not available
                    return `~${property.unitSize}${property.unitMeasure || 'm²'}`;
                  })()}
                </p>
              </div>
            )}

            {isFlexible && property.totalArea && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Square className="h-4 w-4 text-primary" />
                  <span>Total Luas Tanah:</span>
                </div>
                <p className="font-medium">{formatNumber(property.totalArea)}{property.unitMeasure}</p>
              </div>
            )}

            {!isCoBuilding && !isFlexible && property.totalArea && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Square className="h-4 w-4 text-primary" />
                  <span>Total Luas Lahan:</span>
                </div>
                <p className="font-medium">{formatNumber(property.totalArea)}{property.unitMeasure || 'm²'}</p>
              </div>
            )}

            {isCoBuilding && property.buildingArea && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Square className="h-4 w-4 text-primary" />
                  <span>Total Luas Bangunan:</span>
                </div>
                <p className="font-medium">{formatNumber(property.buildingArea)}{property.unitMeasure || 'm²'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Per Kavling - Only for co-owning with unitPrices */}
      {!isCoBuilding && !isFlexible && property.unitPrices && property.unitPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Detail Per Kavling
            </CardTitle>
            <CardDescription>
              Informasi lengkap setiap kavling termasuk ukuran dan harga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kavling</TableHead>
                      <TableHead>Ukuran ({property.unitMeasure || 'm²'})</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.unitPrices.map((plot, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">Kavling {index + 1}</TableCell>
                        <TableCell>{formatNumber(plot.size || 0)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(plot.price || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(unitPricesTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {hasPriceDiscrepancy && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Perhatian: Perbedaan Harga
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        Total harga dari kavling: <strong>{formatCurrency(unitPricesTotal || 0)}</strong>
                        <br />
                        Harga properti: <strong>{formatCurrency(property.price)}</strong>
                        <br />
                        Selisih: <strong>{formatCurrency(Math.abs(unitPricesTotal! - property.price))}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasPriceDiscrepancy && unitPricesTotal !== null && (
                <div className="text-sm text-muted-foreground">
                  ✓ Total harga kavling sesuai dengan harga properti
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Per Unit - Only for co-building with unitPrices */}
      {isCoBuilding && property.unitPrices && property.unitPrices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Detail Per Unit
            </CardTitle>
            <CardDescription>
              Informasi lengkap setiap unit termasuk ukuran dan harga
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Luas ({property.unitMeasure || 'm²'})</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.unitPrices.map((unit, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">Unit {index + 1}</TableCell>
                        <TableCell>{formatNumber(unit.size || 0)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(unit.price || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(unitPricesTotal || 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {hasPriceDiscrepancy && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Perhatian: Perbedaan Harga
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        Total harga dari unit: <strong>{formatCurrency(unitPricesTotal || 0)}</strong>
                        <br />
                        Harga properti: <strong>{formatCurrency(property.price)}</strong>
                        <br />
                        Selisih: <strong>{formatCurrency(Math.abs(unitPricesTotal! - property.price))}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasPriceDiscrepancy && unitPricesTotal !== null && (
                <div className="text-sm text-muted-foreground">
                  ✓ Total harga unit sesuai dengan harga properti
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deskripsi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{property.description}</p>
        </CardContent>
      </Card>

      {/* Planning Info */}
      {property.planningInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Perencanaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {property.planningInfo.developmentPlan && (
              <div className="space-y-2">
                <h3 className="font-semibold">Rencana Pengembangan</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.planningInfo.developmentPlan}
                </p>
              </div>
            )}
            {property.planningInfo.environmentalAnalysis && (
              <div className="space-y-2">
                <h3 className="font-semibold">Analisis Lingkungan</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.planningInfo.environmentalAnalysis}
                </p>
              </div>
            )}
            {property.planningInfo.sitePlanUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold">Denah Lokasi</h3>
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={property.planningInfo.sitePlanUrl}
                    alt="Denah lokasi"
                    fill
                    className="object-contain"
                    data-ai-hint={property.planningInfo.sitePlanHint}
                  />
                </div>
                {property.planningInfo.sitePlanHint && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {property.planningInfo.sitePlanHint}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

