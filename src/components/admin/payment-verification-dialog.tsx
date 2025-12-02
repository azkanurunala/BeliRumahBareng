'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, FileText } from 'lucide-react';
import type { MonthlyPayment } from '@/lib/types';
import { formatCurrency, formatPeriod } from '@/lib/payment-utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

interface PaymentVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: (MonthlyPayment & { projectName: string; userName: string; userAvatar?: string; projectId: string; planId: string }) | null;
  onConfirm: (notes?: string) => void;
}

export function PaymentVerificationDialog({
  open,
  onOpenChange,
  payment,
  onConfirm,
}: PaymentVerificationDialogProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
    setNotes('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes('');
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (payment?.receiptUrl) {
      if (payment.receiptUrl.startsWith('data:')) {
        // Handle base64 data URL
        const link = document.createElement('a');
        link.href = payment.receiptUrl;
        link.download = `bukti-pembayaran-${payment.id}.${payment.receiptUrl.includes('pdf') ? 'pdf' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle regular URL
        window.open(payment.receiptUrl, '_blank');
      }
    }
  };


  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  if (!payment) return null;

  const isImage = payment.receiptUrl?.startsWith('data:image/') || 
                  payment.receiptUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = payment.receiptUrl?.includes('pdf') || 
                payment.receiptUrl?.startsWith('data:application/pdf');

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Verifikasi Pembayaran
            </DialogTitle>
            <DialogDescription>
              Review informasi pembayaran sebelum verifikasi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Payment Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Pembeli</Label>
                  <p className="text-sm font-medium">{payment.userName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Project</Label>
                  <p className="text-sm font-medium">{payment.projectName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Unit</Label>
                  <p className="text-sm font-medium">Unit {payment.unitId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Periode</Label>
                  <p className="text-sm font-medium">{formatPeriod(payment.period)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Jumlah</Label>
                  <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Metode Pembayaran</Label>
                  <p className="text-sm font-medium capitalize">{payment.paymentMethod || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Tanggal Jatuh Tempo</Label>
                  <p className="text-sm font-medium">{formatDate(payment.dueDate)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                  <Badge variant="secondary" className="mt-1">
                    {payment.status === 'paid' ? 'Terbayar' : payment.status === 'overdue' ? 'Terlambat' : payment.status === 'partial' ? 'Sebagian' : 'Menunggu'}
                  </Badge>
                </div>
              </div>

              {/* Payment Reference */}
              {payment.paymentReference && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Nomor Referensi Pembayaran</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="font-mono text-sm">
                      {payment.paymentReference}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Notes */}
              {payment.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Catatan</Label>
                  <p className="text-sm mt-1">{payment.notes}</p>
                </div>
              )}
            </div>

            {/* Receipt Section */}
            {payment.receiptUrl && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground uppercase">Bukti Pembayaran</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden bg-muted/30">
                  {isImage ? (
                    <div className="w-full">
                      <img
                        src={payment.receiptUrl}
                        alt="Bukti pembayaran"
                        className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                      />
                    </div>
                  ) : isPdf ? (
                    <div className="w-full h-[70vh]">
                      <iframe
                        src={payment.receiptUrl}
                        className="w-full h-full border-0"
                        title="Bukti pembayaran PDF"
                        type="application/pdf"
                      />
                    </div>
                  ) : (
                    <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Format file tidak didukung untuk preview
                      </p>
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!payment.receiptUrl && !payment.paymentReference && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Tidak ada bukti pembayaran atau nomor referensi yang tersedia
                </p>
              </div>
            )}

            {/* Verification Notes */}
            <div className="border-t pt-4">
              <Label htmlFor="verification-notes" className="text-sm">
                Catatan Verifikasi (Opsional)
              </Label>
              <Textarea
                id="verification-notes"
                placeholder="Tambahkan catatan verifikasi (opsional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Batal
            </Button>
            <Button onClick={handleConfirm}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verifikasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

