'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Home, Calendar, FileText, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { mockProperties } from '@/lib/mock-data';
import { calculateTotalPaymentProgress, formatCurrency } from '@/lib/payment-utils';

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const property = mockProperties.find(p => p.id === project.propertyId);
  const isClosed = project.status === 'closed' || project.status === 'completed';
  const hasActiveInstallments = project.installmentPlans?.some(p => p.status === 'active') || false;
  const isFullyCompleted = isClosed && !hasActiveInstallments;
  
  const overallProgress = isClosed
    ? 100
    : Math.round(
        (project.progress.kyc +
          project.progress.funding +
          project.progress.legal +
          project.progress.closing) /
          4
      );

  // Calculate payment progress if there are active installments
  const paymentProgress = hasActiveInstallments 
    ? calculateTotalPaymentProgress(project)
    : null;

  const getStatusBadge = () => {
    if (isFullyCompleted) {
      return <Badge className="bg-green-600">Selesai</Badge>;
    }
    if (hasActiveInstallments) {
      return <Badge className="bg-blue-600">Proses Pembayaran</Badge>;
    }
    if (isClosed) {
      return <Badge className="bg-green-600">Selesai</Badge>;
    }
    if (overallProgress >= 50) {
      return <Badge variant="default">Sedang Berjalan</Badge>;
    }
    return <Badge className="bg-yellow-500">Baru Dimulai</Badge>;
  };

  const getStatusText = () => {
    if (hasActiveInstallments) {
      return 'Proses Pembayaran';
    }
    if (isFullyCompleted) {
      return 'Selesai';
    }
    if (isClosed) {
      return 'Selesai';
    }
    if (overallProgress >= 50) {
      return `Progress ${overallProgress}%`;
    }
    return `Progress ${overallProgress}%`;
  };

  const totalUnits = project.unitAssignments.length;
  const totalMembers = project.members.length;
  const totalPrice = project.unitAssignments.reduce((sum, unit) => sum + unit.price, 0);
  
  // Get completed documents count
  const completedDocs = project.documents.filter(doc => doc.status === 'Terverifikasi').length;
  const totalDocs = project.documents.length;

  // Get progress breakdown
  const progressStages = [
    { label: 'KYC', value: project.progress.kyc },
    { label: 'Pendanaan', value: project.progress.funding },
    { label: 'Legal', value: project.progress.legal },
    { label: 'Penutupan', value: project.progress.closing },
  ];

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] group border-2 hover:border-primary/20">
        <div className="flex flex-col md:flex-row">
          {/* Image Section - Left Side */}
          <div className="relative w-full md:w-80 lg:w-96 h-64 md:h-auto overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
            <Image
              src={project.propertyImageUrl}
              alt={project.propertyName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              data-ai-hint={project.propertyImageHint}
            />
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
            <div className="absolute top-4 right-4 z-20">
              {getStatusBadge()}
            </div>
          </div>

          {/* Content Section - Right Side */}
          <div className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2">
                    {project.propertyName}
                  </CardTitle>
                  <CardDescription className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{property?.location || 'Lokasi'}</span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4 pb-4">
              {/* Progress Section */}
              {!isClosed ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progress Keseluruhan</span>
                    <span className="text-sm font-bold text-primary">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2.5" />
                  
                  {/* Progress Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                    {progressStages.map((stage) => (
                      <div key={stage.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{stage.label}</span>
                          <span className="font-medium">{stage.value}%</span>
                        </div>
                        <Progress value={stage.value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {isFullyCompleted ? (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Proyek Selesai</span>
                    </div>
                  ) : hasActiveInstallments ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-600">Proses Pembayaran</span>
                      </div>
                      {paymentProgress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress Pembayaran</span>
                            <span className="font-bold text-primary">{paymentProgress.percentage}%</span>
                          </div>
                          <Progress value={paymentProgress.percentage} className="h-2.5" />
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(paymentProgress.paid)} dari {formatCurrency(paymentProgress.total)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-600">Proyek Selesai</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Anggota</span>
                  </div>
                  <p className="text-lg font-bold">{totalMembers} orang</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-4 w-4" />
                    <span className="text-xs">Unit</span>
                  </div>
                  <p className="text-lg font-bold">{totalUnits} unit</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Dokumen</span>
                  </div>
                  <p className="text-lg font-bold">
                    {completedDocs}/{totalDocs}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Total Biaya</span>
                  </div>
                  <p className="text-sm font-bold truncate" title={formatCurrency(totalPrice)}>
                    {formatCurrency(totalPrice).replace('Rp', 'Rp ').split(',')[0]}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between bg-secondary/30 p-4 pt-3 border-t">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{getStatusText()}</p>
                </div>
                {project.messages && project.messages.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{project.messages.length} pesan</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 shadow-sm hover:shadow-md transition-all duration-300"
              >
                Lihat Detail
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    </Link>
  );
}

