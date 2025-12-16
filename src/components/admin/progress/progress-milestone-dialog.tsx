'use client';

import { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Milestone {
  id?: string;
  label: string;
  date?: string;
  status: 'completed' | 'pending' | 'upcoming';
  order?: number;
}

interface ProgressMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressDetailId: string;
  milestone?: Milestone; // undefined = create, defined = edit
  onSuccess: () => void;
}

export function ProgressMilestoneDialog({
  open,
  onOpenChange,
  progressDetailId,
  milestone,
  onSuccess,
}: ProgressMilestoneDialogProps) {
  const { toast } = useToast();
  const isEditing = !!milestone;
  const [label, setLabel] = useState(milestone?.label || '');
  const [date, setDate] = useState<Date | undefined>(
    milestone?.date ? new Date(milestone.date) : undefined
  );
  const [status, setStatus] = useState<'completed' | 'pending' | 'upcoming'>(
    milestone?.status || 'upcoming'
  );
  const [order, setOrder] = useState(milestone?.order?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open) {
      setLabel(milestone?.label || '');
      setDate(milestone?.date ? new Date(milestone.date) : undefined);
      setStatus(milestone?.status || 'upcoming');
      setOrder(milestone?.order?.toString() || '');
      setValidationError('');
    }
  }, [open, milestone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!label.trim()) {
      setValidationError('Label wajib diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: any = {
        label: label.trim(),
        status,
      };
      if (date) {
        data.date = date.toISOString();
      }
      if (order) {
        const orderNum = parseInt(order);
        if (!isNaN(orderNum)) {
          data.order = orderNum;
        }
      }

      if (isEditing && milestone?.id) {
        // Update existing milestone
        const response = await apiClient.put(
          `/progress-details/${progressDetailId}/milestones/${milestone.id}`,
          data
        );

        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Milestone berhasil diupdate',
          });
          onSuccess();
          handleClose();
        } else {
          toast({
            title: 'Gagal',
            description: response.error?.message || 'Gagal mengupdate milestone',
            variant: 'destructive',
          });
        }
      } else {
        // Create new milestone
        const response = await apiClient.post(
          `/progress-details/${progressDetailId}/milestones`,
          data
        );

        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Milestone berhasil ditambahkan',
          });
          onSuccess();
          handleClose();
        } else {
          toast({
            title: 'Gagal',
            description: response.error?.message || 'Gagal menambahkan milestone',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
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
      setLabel('');
      setDate(undefined);
      setStatus('upcoming');
      setOrder('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Milestone' : 'Tambah Milestone'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update informasi milestone'
              : 'Tambahkan milestone baru untuk progress detail ini'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {validationError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {validationError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Contoh: Foundation Complete"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Akan Datang</SelectItem>
                  <SelectItem value="pending">Sedang Berjalan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Tanggal (opsional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    disabled={isSubmitting}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: id }) : 'Pilih tanggal'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order (opsional)</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="Urutan tampil (kosongkan untuk auto)"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Urutan untuk menampilkan milestone. Kosongkan untuk auto-increment.
              </p>
            </div>
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
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

