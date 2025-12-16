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
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, ConstructionCheckpointProgress, ConstructionCheckpointMilestone, ConstructionCheckpointStatus } from '@/lib/types';

type ConstructionCheckpointManagerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PurchaseTransaction;
  checkpoint?: { progress: ConstructionCheckpointProgress; milestone: ConstructionCheckpointMilestone };
  onSuccess?: () => void;
};

const MILESTONE_OPTIONS: { value: ConstructionCheckpointMilestone; label: string }[] = [
  { value: 'foundation', label: 'Pondasi' },
  { value: 'structure', label: 'Struktur' },
  { value: 'roofing', label: 'Atap' },
  { value: 'finishing', label: 'Finishing' },
];

export default function ConstructionCheckpointManager({
  open,
  onOpenChange,
  transaction,
  checkpoint,
  onSuccess,
}: ConstructionCheckpointManagerProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState<ConstructionCheckpointProgress>(
    checkpoint?.progress || 25
  );
  const [milestone, setMilestone] = useState<ConstructionCheckpointMilestone>(
    checkpoint?.milestone || 'foundation'
  );
  const [status, setStatus] = useState<ConstructionCheckpointStatus>('pending');
  const [startDate, setStartDate] = useState<string>('');
  const [completedDate, setCompletedDate] = useState<string>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPhotos = [...photos, ...files];
      setPhotos(newPhotos);

      // Create previews
      const newPreviews = [...photoPreviews];
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            setPhotoPreviews([...newPreviews]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!progress || !milestone || !status) {
      setValidationError('Progress, milestone, dan status harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first to blob storage (if any)
      const photoUrls: string[] = [];
      
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo) => {
          formData.append('images', photo);
        });

        const uploadResponse = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success || !uploadResult.data) {
          throw new Error(uploadResult.error?.message || 'Failed to upload photos');
        }

        // Extract URLs from upload result
        photoUrls.push(...uploadResult.data.map((img: { url: string; hint: string }) => img.url));
      }

      const response = await apiClient.post('/construction-checkpoints', {
        transactionId: transaction.id,
        progress,
        milestone,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        completedDate: completedDate ? new Date(completedDate).toISOString() : undefined,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        notes: notes || undefined,
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Checkpoint pembangunan berhasil diupdate',
        });
        onSuccess?.();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal mengupdate checkpoint',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating checkpoint:', error);
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
      setProgress(checkpoint?.progress || 25);
      setMilestone(checkpoint?.milestone || 'foundation');
      setStatus('pending');
      setStartDate('');
      setCompletedDate('');
      setPhotos([]);
      setPhotoPreviews([]);
      setNotes('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Construction Checkpoint</DialogTitle>
          <DialogDescription>
            Update progress checkpoint pembangunan (tracking saja, bukan payment trigger)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Progress */}
            <div className="space-y-2">
              <Label>
                Progress <span className="text-destructive">*</span>
              </Label>
              <Select
                value={progress.toString()}
                onValueChange={(value) => setProgress(parseInt(value) as ConstructionCheckpointProgress)}
                disabled={!!checkpoint}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Milestone */}
            <div className="space-y-2">
              <Label>
                Milestone <span className="text-destructive">*</span>
              </Label>
              <Select
                value={milestone}
                onValueChange={(value) => setMilestone(value as ConstructionCheckpointMilestone)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as ConstructionCheckpointStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Belum Dimulai</SelectItem>
                  <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai (Opsional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Completed Date */}
            <div className="space-y-2">
              <Label htmlFor="completedDate">Tanggal Selesai (Opsional)</Label>
              <Input
                id="completedDate"
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <Label>Foto Progress (Opsional)</Label>
              <div className="space-y-2">
                {photoPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={preview}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <label
                  htmlFor="photos"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Klik untuk upload</span> foto
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG (MAX. 5MB per foto)</p>
                  </div>
                  <input
                    id="photos"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tentang progress checkpoint..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Checkpoint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

