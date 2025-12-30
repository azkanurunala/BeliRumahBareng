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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Building, MapPin, DollarSign, User, Mail, Phone, Calendar, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import type { PropertySubmission } from '@/lib/types';
import type { User as UserType } from '@/lib/types';
import { normalizeUnitMeasure } from '@/lib/utils';
import FullscreenImageViewer from '@/components/fullscreen-image-viewer';

interface SubmissionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: PropertySubmission | null;
  submitter: UserType | null;
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string) => void;
  onMarkAsContacted: (submissionId: string) => void;
}

export function SubmissionDetailModal({
  open,
  onOpenChange,
  submission,
  submitter,
  onApprove,
  onReject,
  onMarkAsContacted,
}: SubmissionDetailModalProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!submission) return null;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageViewerOpen(true);
  };

  const handleApprove = () => {
    onApprove(submission.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject(submission.id);
    onOpenChange(false);
  };

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(submission.askingPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Property Submission</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang pengajuan properti
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant={
                submission.status === 'approved'
                  ? 'default'
                  : submission.status === 'rejected'
                  ? 'destructive'
                  : submission.status === 'contacted'
                  ? 'default'
                  : 'secondary'
              }
              className="text-sm"
            >
              {submission.status === 'approved'
                ? 'Disetujui'
                : submission.status === 'rejected'
                ? 'Ditolak'
                : submission.status === 'contacted'
                ? 'Sudah dihubungi'
                : 'Menunggu Review'}
            </Badge>
            {submission.reviewedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Direview: {new Date(submission.reviewedAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Property Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              Informasi Properti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nama Properti</Label>
                <div className="font-medium">{submission.name}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Lokasi
                </Label>
                <div className="font-medium">{submission.location}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Tipe</Label>
                <div className="font-medium">
                  <Badge variant={submission.type === 'co-building' ? 'default' : 'secondary'}>
                    {submission.type === 'co-building' ? 'Co-Building' : 'Co-Owning'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Harga Penawaran
                </Label>
                <div className="font-medium">{formattedPrice}</div>
              </div>
              {submission.totalUnits && (
                <div>
                  <Label className="text-sm text-muted-foreground">Total Unit</Label>
                  <div className="font-medium">{submission.totalUnits}</div>
                </div>
              )}
              {submission.totalArea && (
                <div>
                  <Label className="text-sm text-muted-foreground">Total Luas</Label>
                  <div className="font-medium">
                    {submission.totalArea} {normalizeUnitMeasure(submission.unitMeasure)}
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Deskripsi</Label>
              <p className="text-sm mt-1">{submission.description}</p>
            </div>
          </div>

          {/* Images */}
          {submission.images && submission.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Gambar Properti
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {submission.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="relative aspect-video rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleImageClick(idx)}
                  >
                    <Image
                      src={img.url}
                      alt={img.hint || `Gambar ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {submission.images && submission.images.length > 0 && (
                <FullscreenImageViewer
                  images={submission.images.map((img, idx) => ({
                    url: img.url,
                    alt: img.hint || `Gambar ${idx + 1}`,
                    hint: img.hint,
                  }))}
                  initialIndex={selectedImageIndex}
                  isOpen={imageViewerOpen}
                  onClose={() => setImageViewerOpen(false)}
                />
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold">Informasi Kontak</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Contact Person</Label>
                  <div className="font-medium">{submission.contactPerson}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">No. Telepon</Label>
                  <div className="font-medium">{submission.contactPhone}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="font-medium">{submission.contactEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitter Information */}
          {submitter && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Diajukan Oleh</h3>
              <p className="text-sm">{submitter.name}</p>
            </div>
          )}

          {/* Review Notes */}
          {submission.reviewedAt && submission.notes && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Review Notes</h3>
              <p className="text-sm text-muted-foreground">{submission.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 border-t pt-4">
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              {submission.status !== 'contacted' && (
                <Button variant="outline" onClick={() => onMarkAsContacted(submission.id)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Tandai sebagai Contacted
                </Button>
              )}
              {submission.status === 'pending' && (
                <>
                  <Button variant="destructive" onClick={handleReject}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                  <Button onClick={handleApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Setujui & Buat Properti
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

