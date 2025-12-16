'use client';

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
import { CheckCircle, XCircle, User, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
import type { PropertyInterest } from '@/lib/types';
import type { Property, User as UserType } from '@/lib/types';
import { normalizeUnitMeasure } from '@/lib/utils';

interface InterestDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interest: PropertyInterest | null;
  property: Property | null;
  user: UserType | null;
  onApprove: (interestId: string) => void; // Changed: no notes parameter, will use confirmation dialog
  onReject: (interestId: string) => void; // Changed: no notes parameter, will use confirmation dialog
}

export function InterestDetailModal({
  open,
  onOpenChange,
  interest,
  property,
  user,
  onApprove,
  onReject,
}: InterestDetailModalProps) {
  if (!interest) return null;

  const handleApprove = () => {
    onApprove(interest.id);
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject(interest.id);
    onOpenChange(false);
  };

  const isFlexible = property && !property.totalUnits && property.totalArea;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Peminat Properti</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang pernyataan minat pengguna
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant={
                interest.status === 'approved'
                  ? 'default'
                  : interest.status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-sm"
            >
              {interest.status === 'approved'
                ? 'Disetujui'
                : interest.status === 'rejected'
                ? 'Ditolak'
                : 'Menunggu Review'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(interest.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pengguna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nama</Label>
                <p className="font-medium">{user?.name || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <p className="font-medium">{interest.email || user?.email || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  No. Telepon/WhatsApp
                </Label>
                <p className="font-medium">{interest.phoneNumber || user?.phoneNumber || '-'}</p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          {property && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informasi Properti
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Nama Properti</Label>
                  <p className="font-medium">{property.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Lokasi
                  </Label>
                  <p className="font-medium">{property.location}</p>
                </div>
                {!isFlexible && interest.unitId && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Unit yang Dipilih</Label>
                    <div className="font-medium">
                      <Badge variant="outline">
                        {property.unitName} {interest.unitId}
                      </Badge>
                    </div>
                  </div>
                )}
                {isFlexible && interest.unitSize && property && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Luas yang Diminati</Label>
                    <p className="font-medium">{interest.unitSize} {normalizeUnitMeasure(property.unitMeasure)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Interest Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detail Minat</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div>
                  {interest.isFirstHome ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Rumah Pertama</Label>
                  <p className="font-medium">
                    {interest.isFirstHome ? 'Ya' : 'Tidak'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  {interest.willOccupy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Akan Ditempati</Label>
                  <p className="font-medium">
                    {interest.willOccupy ? 'Ya' : 'Tidak'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {interest.status === 'pending' && (
            <div className="space-y-4 border-t pt-4">
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Tutup
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tolak
                </Button>
                <Button onClick={handleApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Setujui
                </Button>
              </DialogFooter>
            </div>
          )}

          {interest.status !== 'pending' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

