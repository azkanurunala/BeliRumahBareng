'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { PurchaseTransaction, KprStatus } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type KprStatusTrackerProps = {
  transaction: PurchaseTransaction;
  onStatusUpdate?: () => void;
  isAdmin?: boolean;
};

export default function KprStatusTracker({
  transaction,
  onStatusUpdate,
  isAdmin = false,
}: KprStatusTrackerProps) {
  const { toast } = useToast();
  const [kprStatus, setKprStatus] = useState<KprStatus | null>(transaction.kprStatus || null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction.kprStatus) {
      setKprStatus(transaction.kprStatus);
    }
  }, [transaction.kprStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Disetujui
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Ditolak
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge className="bg-primary">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu Persetujuan
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleUpdateStatus = async (formData: {
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    bankName?: string;
    rejectionReason?: string;
    notes?: string;
  }) => {
    setIsSubmitting(true);

    try {
      const updateData: any = {
        transactionId: transaction.id,
        status: formData.status,
      };

      if (formData.bankName) updateData.bankName = formData.bankName;
      if (formData.rejectionReason) updateData.rejectionReason = formData.rejectionReason;
      if (formData.notes) updateData.notes = formData.notes;

      // Set dates based on status
      const now = new Date().toISOString();
      if (formData.status === 'SUBMITTED') {
        updateData.submittedDate = now;
      } else if (formData.status === 'APPROVED') {
        updateData.approvedDate = now;
      } else if (formData.status === 'REJECTED') {
        updateData.rejectedDate = now;
      }

      const response = await apiClient.patch('/kpr-status', updateData);

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Status KPR berhasil diperbarui',
        });
        setKprStatus(response.data);
        onStatusUpdate?.();
        setIsUpdateDialogOpen(false);
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal memperbarui status KPR',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating KPR status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!kprStatus && transaction.state !== 'KPR_PROCESS' && transaction.paymentType !== 'kpr') {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status KPR</CardTitle>
              <CardDescription>Tracking status pengajuan KPR</CardDescription>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateDialogOpen(true)}
              >
                Update Status
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {kprStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(kprStatus.status)}
              </div>

              {kprStatus.bankName && (
                <div>
                  <span className="text-sm font-medium">Bank:</span>
                  <p className="text-sm text-muted-foreground">{kprStatus.bankName}</p>
                </div>
              )}

              {kprStatus.submittedDate && (
                <div>
                  <span className="text-sm font-medium">Tanggal Pengajuan:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(kprStatus.submittedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}

              {kprStatus.approvedDate && (
                <div>
                  <span className="text-sm font-medium">Tanggal Disetujui:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(kprStatus.approvedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}

              {kprStatus.rejectedDate && (
                <div>
                  <span className="text-sm font-medium">Tanggal Ditolak:</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(kprStatus.rejectedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
              )}

              {kprStatus.rejectionReason && (
                <div>
                  <span className="text-sm font-medium">Alasan Penolakan:</span>
                  <p className="text-sm text-muted-foreground">{kprStatus.rejectionReason}</p>
                </div>
              )}

              {kprStatus.notes && (
                <div>
                  <span className="text-sm font-medium">Catatan:</span>
                  <p className="text-sm text-muted-foreground">{kprStatus.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada status KPR</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => setIsUpdateDialogOpen(true)}
                >
                  Buat Status KPR
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      {isAdmin && (
        <KprStatusUpdateDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          currentStatus={kprStatus}
          onSubmit={handleUpdateStatus}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}

type KprStatusUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: KprStatus | null;
  onSubmit: (data: {
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    bankName?: string;
    rejectionReason?: string;
    notes?: string;
  }) => void;
  isSubmitting: boolean;
};

function KprStatusUpdateDialog({
  open,
  onOpenChange,
  currentStatus,
  onSubmit,
  isSubmitting,
}: KprStatusUpdateDialogProps) {
  const [status, setStatus] = useState<'SUBMITTED' | 'APPROVED' | 'REJECTED'>(
    (currentStatus?.status as any) || 'SUBMITTED'
  );
  const [bankName, setBankName] = useState<string>(currentStatus?.bankName || '');
  const [rejectionReason, setRejectionReason] = useState<string>(
    currentStatus?.rejectionReason || ''
  );
  const [notes, setNotes] = useState<string>(currentStatus?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      status,
      bankName: bankName || undefined,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status KPR</DialogTitle>
          <DialogDescription>
            Update status pengajuan KPR (visibility internal, bukan integrasi bank)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBMITTED">Diajukan</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">Nama Bank (Opsional)</Label>
              <Input
                id="bankName"
                placeholder="Nama bank pengajuan KPR"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            {status === 'REJECTED' && (
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Alasan Penolakan</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Alasan penolakan KPR..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

