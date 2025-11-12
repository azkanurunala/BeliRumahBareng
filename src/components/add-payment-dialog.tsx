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
import type { InstallmentPlan } from '@/lib/types';
import { formatCurrency } from '@/lib/payment-utils';
import { Calendar, Upload, FileText, X } from 'lucide-react';

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
  }) => void;
};

export default function AddPaymentDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
}: AddPaymentDialogProps) {
  const [amount, setAmount] = useState<string>(plan.installmentAmount.toString());
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [notes, setNotes] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!period || !amount || !paymentDate) {
      return;
    }

    onSubmit?.({
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate).toISOString(),
      period,
      paymentMethod,
      notes: notes || undefined,
      receiptFile: receiptFile || undefined,
    });

    // Reset form
    setAmount(plan.installmentAmount.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPeriod('');
    setPaymentMethod('transfer');
    setNotes('');
    setReceiptFile(null);
    setReceiptPreview(null);
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
      setAmount(plan.installmentAmount.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPeriod('');
      setPaymentMethod('transfer');
      setNotes('');
      setReceiptFile(null);
      setReceiptPreview(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
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
              <Label htmlFor="period">Periode *</Label>
              <Select value={period} onValueChange={setPeriod} required>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Pilih periode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {availablePeriods.length > 0 ? (
                    availablePeriods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatPeriod(p)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Semua periode sudah dibayar
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={formatCurrency(plan.installmentAmount)}
                  required
                  min={0}
                  step={1000}
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
              <div className="relative">
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metode Pembayaran *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
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

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Bukti Pembayaran (Opsional)</Label>
              {!receiptFile ? (
                <div className="relative">
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={!period || !amount || !paymentDate}>
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

