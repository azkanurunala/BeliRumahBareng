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
import type { PurchaseTransaction, AppointmentType } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type AppointmentSchedulingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PurchaseTransaction;
  type?: AppointmentType;
  onSuccess?: () => void;
};

export default function AppointmentSchedulingDialog({
  open,
  onOpenChange,
  transaction,
  type,
  onSuccess,
}: AppointmentSchedulingDialogProps) {
  const { toast } = useToast();
  const [appointmentType, setAppointmentType] = useState<AppointmentType>(
    type || 'interview'
  );
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string>('09:00');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!scheduledDate) {
      setValidationError('Tanggal appointment harus diisi');
      return;
    }

    if (!scheduledTime) {
      setValidationError('Waktu appointment harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':');
      const appointmentDateTime = new Date(scheduledDate);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await apiClient.post('/appointments', {
        transactionId: transaction.id,
        type: appointmentType,
        scheduledDate: appointmentDateTime.toISOString(),
        location: location || undefined,
        notes: notes || undefined,
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Appointment berhasil dijadwalkan',
        });
        onSuccess?.();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menjadwalkan appointment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
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
      setScheduledDate(new Date());
      setScheduledTime('09:00');
      setLocation('');
      setNotes('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  const getAppointmentTypeLabel = (type: AppointmentType) => {
    switch (type) {
      case 'interview':
        return 'Wawancara';
      case 'notaris':
        return 'Notaris';
      case 'bank':
        return 'Bank';
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Jadwalkan Appointment</DialogTitle>
          <DialogDescription>
            Buat jadwal appointment untuk transaksi unit {transaction.unitId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Appointment Type */}
            <div className="space-y-2">
              <Label>
                Tipe Appointment <span className="text-destructive">*</span>
              </Label>
              <Select
                value={appointmentType}
                onValueChange={(value) => setAppointmentType(value as AppointmentType)}
                disabled={!!type}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Wawancara</SelectItem>
                  <SelectItem value="notaris">Notaris</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label>
                Tanggal <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !scheduledDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? (
                      format(scheduledDate, 'PPP', { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(date) => date && setScheduledDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Scheduled Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Waktu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="scheduledTime"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Lokasi (Opsional)</Label>
              <Input
                id="location"
                placeholder="Alamat atau lokasi appointment"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
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
              {isSubmitting ? 'Menyimpan...' : 'Jadwalkan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

