'use client';

import React, { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import type { InstallmentPlan } from '@/lib/types';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '@/lib/payment-utils';
import { Upload, FileText, X } from 'lucide-react';
import { useEffect } from 'react';

type AddPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: InstallmentPlan;
  onSubmit?: (paymentData: {
    amount: number;
    paymentDate: string;
    period: string;
    paymentMethod: string;
    notes?: string;
    receiptFile?: File;
    paymentReference?: string;
  }) => void;
};

export default function AddPaymentDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState<string>(formatCurrencyInput(plan.installmentAmount));
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [periodPopoverOpen, setPeriodPopoverOpen] = useState(false);

  // Generate available periods (next unpaid months)
  const getAvailablePeriods = () => {
    const paidPeriods = new Set(plan.payments.filter(p => p.status === 'paid').map(p => p.period));
    const periods: string[] = [];
    const startDate = new Date(plan.startDate);
    
    for (let i = 0; i < plan.totalInstallments; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      const periodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!paidPeriods.has(periodStr)) {
        periods.push(periodStr);
      }
    }
    
    return periods;
  };

  const availablePeriods = getAvailablePeriods();

  // Get current month period
  const getCurrentMonthPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Get payment number (ke berapa) based on selected period
  const getPaymentNumber = (selectedPeriod: string) => {
    if (!selectedPeriod) return null;
    const startDate = new Date(plan.startDate);
    const [year, month] = selectedPeriod.split('-');
    const periodDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    const monthsDiff = (periodDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (periodDate.getMonth() - startDate.getMonth());
    return monthsDiff + 1; // +1 because first payment is payment #1
  };

  // Set default period to current month if available
  useEffect(() => {
    if (open && !period && availablePeriods.length > 0) {
      const currentPeriod = getCurrentMonthPeriod();
      if (availablePeriods.includes(currentPeriod)) {
        setPeriod(currentPeriod);
      } else {
        // If current month not available, use first available period
        setPeriod(availablePeriods[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!period || !amount || !paymentDate) {
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
      period,
      paymentMethod,
      notes: notes || undefined,
      receiptFile: receiptFile || undefined,
      paymentReference: paymentReference.trim() || undefined,
    });

    // Reset form
    setAmount(formatCurrencyInput(plan.installmentAmount));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPeriod('');
    setPaymentMethod('transfer');
    setNotes('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setPaymentReference('');
    setValidationError('');
    onOpenChange(false);
  };

  const formatPeriod = (periodStr: string) => {
    try {
      const [year, month] = periodStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } catch {
      return periodStr;
    }
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
      setAmount(formatCurrencyInput(plan.installmentAmount));
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPeriod('');
      setPaymentMethod('transfer');
      setNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
      setPaymentReference('');
      setValidationError('');
      setPeriodPopoverOpen(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-foreground via-[#243665] to-foreground bg-clip-text text-transparent">
            Input Pembayaran Cicilan
          </DialogTitle>
          <DialogDescription>
            Catat pembayaran cicilan untuk Unit {plan.unitId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Period Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="period">Periode *</Label>
                {period && getPaymentNumber(period) && (
                  <Badge variant="secondary" className="text-xs">
                    Pembayaran ke {getPaymentNumber(period)} dari {plan.totalInstallments}
                  </Badge>
                )}
              </div>
              {availablePeriods.length > 0 ? (
                <Popover open={periodPopoverOpen} onOpenChange={setPeriodPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {period ? (
                        <span>
                          {formatPeriod(period)}
                          {getPaymentNumber(period) && (
                            <span className="ml-2 text-muted-foreground">
                              (ke {getPaymentNumber(period)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Pilih periode pembayaran</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-3" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                      {availablePeriods.map((p) => {
                        const isSelected = period === p;
                        const paymentNum = getPaymentNumber(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPeriod(p);
                              setPeriodPopoverOpen(false);
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {formatPeriod(p)}
                            {paymentNum && (
                              <span className="ml-1.5 text-xs opacity-80">
                                (ke {paymentNum})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="p-3 rounded-lg border bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">
                    Semua periode sudah dibayar
                  </p>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value);
                    setAmount(formatCurrencyInput(parsed));
                  }}
                  placeholder={formatCurrencyInput(plan.installmentAmount)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  IDR
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cicilan standar: {formatCurrency(plan.installmentAmount)}
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
            <Button type="submit" disabled={!period || !amount || !paymentDate || parseCurrencyInput(amount) === 0}>
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

