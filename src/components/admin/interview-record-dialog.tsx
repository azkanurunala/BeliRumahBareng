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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, InterviewResult } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type InterviewRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PurchaseTransaction;
  interviewerId: string; // Admin user ID
  onSuccess?: () => void;
};

export default function InterviewRecordDialog({
  open,
  onOpenChange,
  transaction,
  interviewerId,
  onSuccess,
}: InterviewRecordDialogProps) {
  const { toast } = useToast();
  const [interviewDate, setInterviewDate] = useState<Date>(new Date());
  const [result, setResult] = useState<InterviewResult | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!interviewDate) {
      setValidationError('Tanggal wawancara harus diisi');
      return;
    }

    if (!result) {
      setValidationError('Hasil wawancara harus dipilih');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/interview-records', {
        transactionId: transaction.id,
        interviewDate: interviewDate.toISOString(),
        result,
        notes: notes || undefined,
        // interviewerId will be determined by backend from auth
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Hasil wawancara berhasil dicatat',
        });
        onSuccess?.();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal mencatat hasil wawancara',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error recording interview:', error);
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
      setInterviewDate(new Date());
      setResult('');
      setNotes('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Hasil Wawancara</DialogTitle>
          <DialogDescription>
            Catat hasil wawancara untuk transaksi unit {transaction.unitId}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              ⚠️ Hanya mencatat hasil, tidak menyimpan data sensitif KYC
            </span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Interview Date */}
            <div className="space-y-2">
              <Label>
                Tanggal Wawancara <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !interviewDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interviewDate ? (
                      format(interviewDate, 'PPP', { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={interviewDate}
                    onSelect={(date) => date && setInterviewDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Interview Result */}
            <div className="space-y-2">
              <Label>
                Hasil Wawancara <span className="text-destructive">*</span>
              </Label>
              <Select value={result} onValueChange={(value) => setResult(value as InterviewResult)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih hasil wawancara" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSED">Lulus</SelectItem>
                  <SelectItem value="FAILED">Tidak Lulus</SelectItem>
                  <SelectItem value="NEED_FOLLOW_UP">Perlu Tindak Lanjut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan tentang wawancara..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Catatan ini tidak akan menyimpan data sensitif seperti KTP, slip gaji, dll.
              </p>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Wawancara'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

