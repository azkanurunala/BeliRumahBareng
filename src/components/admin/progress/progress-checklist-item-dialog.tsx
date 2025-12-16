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
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ProgressChecklistItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ProgressChecklistItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressDetailId: string;
  item?: ProgressChecklistItem; // undefined = create, defined = edit
  onSuccess: () => void;
}

export function ProgressChecklistItemDialog({
  open,
  onOpenChange,
  progressDetailId,
  item,
  onSuccess,
}: ProgressChecklistItemDialogProps) {
  const { toast } = useToast();
  const isEditing = !!item;
  const [label, setLabel] = useState(item?.label || '');
  const [order, setOrder] = useState((item as any)?.order?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (open) {
      setLabel(item?.label || '');
      setOrder((item as any)?.order?.toString() || '');
      setValidationError('');
    }
  }, [open, item]);

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
      if (isEditing && item) {
        // Update existing item
        const updateData: any = { label: label.trim() };
        if (order) {
          const orderNum = parseInt(order);
          if (!isNaN(orderNum)) {
            updateData.order = orderNum;
          }
        }

        const response = await apiClient.put(
          `/progress-details/${progressDetailId}/checklist/${item.id}`,
          updateData
        );

        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Checklist item berhasil diupdate',
          });
          onSuccess();
          handleClose();
        } else {
          toast({
            title: 'Gagal',
            description: response.error?.message || 'Gagal mengupdate checklist item',
            variant: 'destructive',
          });
        }
      } else {
        // Create new item
        const createData: any = {
          label: label.trim(),
        };
        if (order) {
          const orderNum = parseInt(order);
          if (!isNaN(orderNum)) {
            createData.order = orderNum;
          }
        }

        const response = await apiClient.post(
          `/progress-details/${progressDetailId}/checklist`,
          createData
        );

        if (response.success) {
          toast({
            title: 'Berhasil',
            description: 'Checklist item berhasil ditambahkan',
          });
          onSuccess();
          handleClose();
        } else {
          toast({
            title: 'Gagal',
            description: response.error?.message || 'Gagal menambahkan checklist item',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error saving checklist item:', error);
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
      setOrder('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Checklist Item' : 'Tambah Checklist Item'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update informasi checklist item'
              : 'Tambahkan checklist item baru untuk progress detail ini'}
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
                placeholder="Contoh: Verifikasi dokumen KTP"
                disabled={isSubmitting}
              />
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
                Urutan untuk menampilkan checklist item. Kosongkan untuk auto-increment.
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

