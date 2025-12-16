'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, XCircle, ArrowRight } from 'lucide-react';
import type { PurchaseTransaction, PurchaseTransactionState } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

type PurchaseFlowProps = {
  transaction: PurchaseTransaction;
  onStateChange?: () => void;
  showActions?: boolean;
  userRole?: 'admin' | 'sales' | 'customer';
};

const STATE_DEFINITIONS: Record<
  PurchaseTransactionState,
  { label: string; description: string; color: string }
> = {
  DRAFT: {
    label: 'Draft',
    description: 'Transaksi baru dibuat',
    color: 'bg-gray-500',
  },
  BOOKED: {
    label: 'Booking Fee Dibayar',
    description: 'Booking fee telah dibayar, unit terkunci',
    color: 'bg-blue-500',
  },
  INTERVIEWED: {
    label: 'Wawancara Selesai',
    description: 'Wawancara dengan admin telah dilakukan',
    color: 'bg-purple-500',
  },
  CASH_PROCESS: {
    label: 'Proses Cash',
    description: 'Menunggu jadwal notaris',
    color: 'bg-green-500',
  },
  KPR_PROCESS: {
    label: 'Proses KPR',
    description: 'Menunggu persetujuan KPR dari bank',
    color: 'bg-orange-500',
  },
  UNDER_CONSTRUCTION: {
    label: 'Sedang Dibangun',
    description: 'Proses pembangunan sedang berjalan',
    color: 'bg-yellow-500',
  },
  HANDOVER: {
    label: 'Serah Terima',
    description: 'Rumah selesai, siap diserahkan',
    color: 'bg-indigo-500',
  },
  COMPLETED: {
    label: 'Selesai',
    description: 'Transaksi selesai',
    color: 'bg-green-600',
  },
};

const STATE_ORDER: PurchaseTransactionState[] = [
  'DRAFT',
  'BOOKED',
  'INTERVIEWED',
  'CASH_PROCESS',
  'KPR_PROCESS',
  'UNDER_CONSTRUCTION',
  'HANDOVER',
  'COMPLETED',
];

export default function PurchaseFlow({
  transaction,
  onStateChange,
  showActions = false,
  userRole = 'customer',
}: PurchaseFlowProps) {
  const { toast } = useToast();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentStateIndex, setCurrentStateIndex] = useState(0);

  useEffect(() => {
    const index = STATE_ORDER.indexOf(transaction.state);
    setCurrentStateIndex(index >= 0 ? index : 0);
  }, [transaction.state]);

  const getStateStatus = (state: PurchaseTransactionState, index: number) => {
    if (index < currentStateIndex) {
      return 'completed';
    }
    if (index === currentStateIndex) {
      return 'current';
    }
    return 'pending';
  };

  const getAllowedNextStates = (): PurchaseTransactionState[] => {
    // This would be fetched from API or calculated based on state machine rules
    // For now, return empty array - should be implemented with API call
    return [];
  };

  const handleStateTransition = async (toState: PurchaseTransactionState) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    try {
      const response = await apiClient.post('/purchase-transactions', {
        transactionId: transaction.id,
        toState,
        // userId and actorRole will be determined by backend from auth
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: `Status berhasil diubah ke ${STATE_DEFINITIONS[toState].label}`,
        });
        onStateChange?.();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal mengubah status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alur Pembelian</CardTitle>
        <CardDescription>Status transaksi pembelian unit {transaction.unitId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* State Timeline */}
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* States */}
            <div className="relative space-y-6">
              {STATE_ORDER.map((state, index) => {
                const status = getStateStatus(state, index);
                const stateDef = STATE_DEFINITIONS[state];
                const isCompleted = status === 'completed';
                const isCurrent = status === 'current';
                const isPending = status === 'pending';

                return (
                  <div key={state} className="relative flex items-start gap-4">
                    {/* State Icon */}
                    <div className="relative z-10">
                      {isCompleted ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                      ) : isCurrent ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/20">
                          <Clock className="h-6 w-6 animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Circle className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* State Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{stateDef.label}</h4>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Saat Ini
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{stateDef.description}</p>

                      {/* Show additional info based on state */}
                      {isCurrent && transaction.state === 'BOOKED' && transaction.bookingDate && (
                        <p className="text-xs text-muted-foreground">
                          Booking Date: {new Date(transaction.bookingDate).toLocaleDateString('id-ID')}
                        </p>
                      )}

                      {isCurrent && transaction.state === 'INTERVIEWED' && transaction.interviewRecord && (
                        <div className="mt-2">
                          <Badge
                            variant={
                              transaction.interviewRecord.result === 'PASSED'
                                ? 'default'
                                : transaction.interviewRecord.result === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {transaction.interviewRecord.result === 'PASSED'
                              ? 'Lulus'
                              : transaction.interviewRecord.result === 'FAILED'
                              ? 'Tidak Lulus'
                              : 'Perlu Tindak Lanjut'}
                          </Badge>
                        </div>
                      )}

                      {isCurrent && transaction.state === 'KPR_PROCESS' && transaction.kprStatus && (
                        <div className="mt-2">
                          <Badge
                            variant={
                              transaction.kprStatus.status === 'APPROVED'
                                ? 'default'
                                : transaction.kprStatus.status === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            KPR: {transaction.kprStatus.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons (if showActions is true and user has permission) */}
          {showActions && userRole === 'admin' && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Transisi status hanya dapat dilakukan oleh admin
              </p>
              {/* State transition buttons would go here */}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

