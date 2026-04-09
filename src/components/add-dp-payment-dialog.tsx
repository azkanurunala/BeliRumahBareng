'use client';

import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { InstallmentPlan } from '@/lib/types';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';
import { Upload, FileText, X } from 'lucide-react';

type AddDPPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: InstallmentPlan;
  onSubmit?: (paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
    receiptFile?: File;
    paymentReference?: string;
  }) => void;
};

export default function AddDPPaymentDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
}: AddDPPaymentDialogProps) {
  const [amount, setAmount] = useState<string>(formatCurrencyInput(plan.downPayment || 0));
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(formatCurrencyInput(plan.downPayment || 0));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('transfer');
      setNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setPaymentReference('');
      setValidationError('');
    }
  }, [open, plan.downPayment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !paymentDate) {
      return;
    }

    // Validation: if payment method is transfer, require either receiptFile or paymentReference
    if (paymentMethod === 'transfer' && !receiptFile && !paymentReference.trim()) {
      setValidationError('Untuk transfer, wajib upload bukti pembayaran atau isi nomor referensi pembayaran');
      return;
    }

    setValidationError('');

    onSubmit?.({
      amount: parseCurrencyInput(amount),
      paymentDate: new Date(paymentDate).toISOString(),
      paymentMethod,
      notes: notes || undefined,
      receiptFile: receiptFile || undefined,
      paymentReference: paymentReference.trim() || undefined,
    });

    // Reset form
    setAmount(formatCurrencyInput(plan.downPayment || 0));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transfer');
    setNotes('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentReference('');
    setValidationError('');
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setAmount(formatCurrencyInput(plan.downPayment || 0));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('transfer');
      setNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setPaymentReference('');
      setValidationError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-foreground via-[#243665] to-foreground bg-clip-text text-transparent">
            Input Pembayaran DP
          </DialogTitle>
          <DialogDescription>
            Catat pembayaran DP untuk Unit {plan.unitId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran DP *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    setAmount(formatCurrencyInput(parsed));
                  }}
                  placeholder={formatCurrencyInput(plan.downPayment || 0)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  IDR
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                DP standar: {formatCurrency(plan.downPayment || 0)}
              </p>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Tanggal Pembayaran *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={(value) => {
                setPaymentMethod(value);
                setValidationError(''); // Clear validation error when method changes
              }} required>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference - shown when method is transfer */}
            {paymentMethod === 'transfer' && (
              <div className="space-y-2">
                <Label htmlFor="paymentReference">
                  Nomor Referensi Pembayaran {!receiptFile && '(Wajib jika tidak upload bukti)'}
                </Label>
                <Input
                  id="paymentReference"
                  type="text"
                  value={paymentReference}
                  onChange={(e) => {
                    setPaymentReference(e.target.value);
                    setValidationError(''); // Clear validation error when typing
                  }}
                  placeholder="Masukkan nomor referensi transfer (opsional jika sudah upload bukti)"
                />
                <p className="text-xs text-muted-foreground">
                  Untuk transfer, wajib upload bukti pembayaran atau isi nomor referensi
                </p>
              </div>
            )}

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">
                Bukti Pembayaran {paymentMethod === 'transfer' && !paymentReference.trim() && '(Wajib jika tidak isi referensi)'}
              </Label>
              {!receiptFile ? (
                <div className="relative">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="h-auto cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
              ) : (
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(receiptFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {receiptPreview && (
                    <div className="mt-3 rounded-md overflow-hidden border">
                      <img
                        src={receiptPreview}
                        alt="Preview bukti pembayaran"
                        className="w-full h-auto max-h-48 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Format yang didukung: JPG, PNG, PDF (maks. 5MB)
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan jika diperlukan..."
                rows={3}
              />
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{validationError}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!amount || !paymentDate || parseCurrencyInput(amount) === 0}>
              Simpan Pembayaran DP
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

