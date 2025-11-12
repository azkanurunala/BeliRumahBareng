'use client';

import { useState } from 'react';
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
import { FileText, MessageCircle, Paperclip, Send } from 'lucide-react';
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

type ProjectDashboardProps = {
  project: Project;
};

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  const property = mockProperties.find(p => p.id === project.propertyId);
  
  // State for dialogs
  const [selectedProgress, setSelectedProgress] = useState<'kyc' | 'funding' | 'legal' | 'closing' | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  
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
            <div className='grid md:grid-cols-5'>
                <div className="relative aspect-video md:aspect-square md:col-span-2">
                    <Image
                        src={project.propertyImageUrl}
                        alt={project.propertyName}
                        fill
                        className="object-cover"
                        data-ai-hint={project.propertyImageHint}
                    />
                </div>
                <div className='p-6 md:col-span-3'>
                    <Badge variant={isFullyCompleted ? 'default' : hasActiveInstallments ? 'default' : isProjectClosed ? 'default' : 'secondary'}>
                        {isFullyCompleted ? 'Selesai' : hasActiveInstallments ? 'Proses Pembayaran' : isProjectClosed ? 'Selesai' : 'Sedang Berjalan'}
                    </Badge>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                        {project.propertyName}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {isFullyCompleted 
                          ? 'Proyek sudah selesai sepenuhnya. Semua pembayaran telah lunas.'
                          : hasActiveInstallments 
                          ? 'Proyek sudah selesai. Kelola pembayaran cicilan bulanan di sini.'
                          : isProjectClosed 
                          ? 'Proyek sudah selesai. Kelola pembayaran cicilan bulanan di sini.'
                          : 'Selamat datang di dasbor proyek kolaboratif Anda. Lacak kemajuan, kelola dokumen, dan berkomunikasi dengan grup Anda di sini.'}
                    </p>
                </div>
            </div>
        </Card>

        {/* Project Progress - Only show if project is active */}
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

        {/* Payment Progress - Only show if there are active installments */}
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
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">
                    {formatCurrency(paymentProgress.paid)} dari {formatCurrency(paymentProgress.total)}
                  </span>
                  <span className="font-medium text-muted-foreground">
                    Sisa: {formatCurrency(paymentProgress.total - paymentProgress.paid)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Installment Overview - Only show if project is closed */}
        {isProjectClosed && project.installmentPlans && project.installmentPlans.length > 0 && (
          <InstallmentOverview plans={project.installmentPlans} />
        )}

        {/* Monthly Payment Cards - Only show if project is closed */}
        {isProjectClosed && project.installmentPlans && project.installmentPlans.length > 0 && (
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
        )}

        {/* Payment History Table - Only show if project is closed */}
        {isProjectClosed && project.installmentPlans && project.installmentPlans.length > 0 && (
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
        )}

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

      </div>
      <div className="space-y-6 lg:col-span-1">
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
    </div>
  );
}
