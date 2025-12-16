'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, PurchaseTransactionState } from '@/lib/types';
import PurchaseFlow from '@/components/purchase-flow';

type PurchaseStateManagerProps = {
  transaction: PurchaseTransaction;
  onStateChange?: () => void;
  userRole?: 'admin' | 'sales';
};

const ALLOWED_TRANSITIONS: Record<PurchaseTransactionState, PurchaseTransactionState[]> = {
  DRAFT: ['BOOKED'],
  BOOKED: ['INTERVIEWED'],
  INTERVIEWED: ['CASH_PROCESS', 'KPR_PROCESS'],
  CASH_PROCESS: ['UNDER_CONSTRUCTION'],
  KPR_PROCESS: ['UNDER_CONSTRUCTION', 'CASH_PROCESS'],
  UNDER_CONSTRUCTION: ['HANDOVER'],
  HANDOVER: ['COMPLETED'],
  COMPLETED: [],
};

export default function PurchaseStateManager({
  transaction,
  onStateChange,
  userRole = 'admin',
}: PurchaseStateManagerProps) {
  const { toast } = useToast();
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [selectedToState, setSelectedToState] = useState<PurchaseTransactionState | ''>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'kpr' | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedTransitions = ALLOWED_TRANSITIONS[transaction.state] || [];

  const handleTransition = async () => {
    if (!selectedToState) return;

    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/purchase-transactions', {
        transactionId: transaction.id,
        toState: selectedToState,
        paymentType: paymentType || undefined,
        notes: notes || undefined,
        // userId and actorRole will be determined by backend from auth
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: `Status berhasil diubah ke ${selectedToState}`,
        });
        onStateChange?.();
        setIsTransitionDialogOpen(false);
        handleCloseDialog();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal mengubah status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error transitioning state:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedToState('');
    setPaymentType('');
    setNotes('');
    setIsTransitionDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage Purchase State</CardTitle>
          <CardDescription>
            Kelola state machine transaksi pembelian (Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current State */}
          <div>
            <Label>Status Saat Ini</Label>
            <div className="mt-2">
              <Badge variant="default" className="text-lg px-3 py-1">
                {transaction.state}
              </Badge>
            </div>
          </div>

          {/* Purchase Flow Visualization */}
          <PurchaseFlow
            transaction={transaction}
            onStateChange={onStateChange}
            showActions={false}
            userRole={userRole}
          />

          {/* Transition Actions */}
          {allowedTransitions.length > 0 && (
            <div className="pt-4 border-t">
              <Label>Transisi yang Diizinkan</Label>
              <div className="mt-2 space-y-2">
                {allowedTransitions.map((toState) => (
                  <Button
                    key={toState}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedToState(toState);
                      setIsTransitionDialogOpen(true);
                    }}
                  >
                    Ubah ke: {toState}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {allowedTransitions.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Tidak ada transisi yang diizinkan dari state ini
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Dialog */}
      <Dialog open={isTransitionDialogOpen} onOpenChange={setIsTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Transaksi</DialogTitle>
            <DialogDescription>
              Ubah status dari {transaction.state} ke {selectedToState}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Payment Type (if transitioning to CASH_PROCESS or KPR_PROCESS) */}
            {(selectedToState === 'CASH_PROCESS' || selectedToState === 'KPR_PROCESS') && (
              <div className="space-y-2">
                <Label>
                  Tipe Pembayaran <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={paymentType}
                  onValueChange={(value) => setPaymentType(value as 'cash' | 'kpr')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="kpr">KPR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tentang transisi status..."
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
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleTransition}
              disabled={isSubmitting || !selectedToState}
            >
              {isSubmitting ? 'Memproses...' : 'Ubah Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

