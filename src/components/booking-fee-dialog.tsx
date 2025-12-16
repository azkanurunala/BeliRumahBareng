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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/payment-utils';
import type { PurchaseTransaction } from '@/lib/types';

type BookingFeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PurchaseTransaction;
  onSuccess?: () => void;
};

export default function BookingFeeDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: BookingFeeDialogProps) {
  const { toast } = useToast();
  const [bookingFeeAmount, setBookingFeeAmount] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPaymentProofPreview(null);
      }
    }
  };

  const removeFile = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!bookingFeeAmount || parseFloat(bookingFeeAmount) <= 0) {
      setValidationError('Jumlah booking fee harus diisi dan lebih dari 0');
      return;
    }

    if (!bookingDate) {
      setValidationError('Tanggal booking harus diisi');
      return;
    }

    if (!paymentProofFile) {
      setValidationError('Bukti pembayaran wajib diupload');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload payment proof first to blob storage
      let paymentProofUrl = '';

      if (paymentProofFile) {
        const formData = new FormData();
        formData.append('image', paymentProofFile);

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success || !uploadResult.data?.url) {
          throw new Error(uploadResult.error?.message || 'Failed to upload payment proof');
        }

        paymentProofUrl = uploadResult.data.url;
      }

      // Submit booking fee payment
      const response = await apiClient.post('/payments/booking-fee', {
        transactionId: transaction.id,
        bookingFeeAmount: parseFloat(bookingFeeAmount),
        bookingDate: new Date(bookingDate).toISOString(),
        paymentProofUrl,
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Booking fee berhasil dibayar. Unit telah dikunci untuk Anda.',
        });
        onSuccess?.();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal memproses pembayaran booking fee',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting booking fee:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setBookingFeeAmount('');
      setBookingDate(new Date().toISOString().split('T')[0]);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Pembayaran Booking Fee
          </DialogTitle>
          <DialogDescription>
            Bayar booking fee untuk unit {transaction.unitId} di project {transaction.projectId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Booking Fee Amount */}
            <div className="space-y-2">
              <Label htmlFor="bookingFeeAmount">
                Jumlah Booking Fee <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bookingFeeAmount"
                type="number"
                placeholder="0"
                value={bookingFeeAmount}
                onChange={(e) => setBookingFeeAmount(e.target.value)}
                min="0"
                step="1000"
                required
              />
              {bookingFeeAmount && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseFloat(bookingFeeAmount) || 0)}
                </p>
              )}
            </div>

            {/* Booking Date */}
            <div className="space-y-2">
              <Label htmlFor="bookingDate">
                Tanggal Pembayaran <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bookingDate"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Payment Proof Upload */}
            <div className="space-y-2">
              <Label>
                Bukti Pembayaran <span className="text-destructive">*</span>
              </Label>
              {!paymentProofFile ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="paymentProof"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, PDF (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="paymentProof"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="relative">
                  {paymentProofPreview ? (
                    <div className="relative">
                      <img
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        className="w-full h-48 object-contain rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{paymentProofFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {validationError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {validationError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Bayar Booking Fee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

