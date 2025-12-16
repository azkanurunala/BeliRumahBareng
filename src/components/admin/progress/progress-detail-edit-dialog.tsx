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
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ProgressDetail } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ProgressDetailEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressDetailId: string;
  progressDetail: ProgressDetail;
  onSuccess: () => void;
}

export function ProgressDetailEditDialog({
  open,
  onOpenChange,
  progressDetailId,
  progressDetail,
  onSuccess,
}: ProgressDetailEditDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(progressDetail.title);
  const [percentage, setPercentage] = useState(progressDetail.percentage.toString());
  const [description, setDescription] = useState(progressDetail.description || '');
  const [notes, setNotes] = useState(progressDetail.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!title.trim()) {
      setValidationError('Title wajib diisi');
      return;
    }

    const percentageNum = parseInt(percentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      setValidationError('Percentage harus antara 0-100');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.put(`/progress-details/${progressDetailId}`, {
        title: title.trim(),
        percentage: percentageNum,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Progress detail berhasil diupdate',
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal mengupdate progress detail',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating progress detail:', error);
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
      setTitle(progressDetail.title);
      setPercentage(progressDetail.percentage.toString());
      setDescription(progressDetail.description || '');
      setNotes(progressDetail.notes || '');
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Progress Detail</DialogTitle>
          <DialogDescription>
            Update informasi progress detail
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
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Verifikasi KYC"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">
                Percentage (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="0-100"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi progress..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                rows={3}
                disabled={isSubmitting}
              />
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
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

