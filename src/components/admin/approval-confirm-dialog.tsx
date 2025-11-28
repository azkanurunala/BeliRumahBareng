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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'approve' | 'reject';
  title: string;
  description: string;
  onConfirm: (notes?: string) => void;
  requireNotes?: boolean; // For rejection, notes might be required
}

export function ApprovalConfirmDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  onConfirm,
  requireNotes = false,
}: ApprovalConfirmDialogProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (requireNotes && !notes.trim()) {
      setError('Notes wajib diisi untuk rejection');
      return;
    }

    setError('');
    onConfirm(notes.trim() || undefined);
    setNotes('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'approve' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {type === 'reject' && (
            <div>
              <Label htmlFor="rejection-notes" className="text-sm">
                Notes Rejection {requireNotes && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="rejection-notes"
                placeholder="Masukkan alasan rejection..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setError('');
                }}
                rows={4}
                className="mt-2"
                required={requireNotes}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {type === 'approve' && (
            <div>
              <Label htmlFor="approval-notes" className="text-sm">
                Notes (Opsional)
              </Label>
              <Textarea
                id="approval-notes"
                placeholder="Tambahkan catatan approval (opsional)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Batal
          </Button>
          <Button
            variant={type === 'reject' ? 'destructive' : 'default'}
            onClick={handleConfirm}
          >
            {type === 'approve' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Setujui
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

