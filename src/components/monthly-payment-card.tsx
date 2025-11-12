'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  calculateRemaining, 
  calculatePaidPercentage, 
  getCurrentMonthPayment,
  getTotalPaid,
  getPaidInstallmentsCount,
  formatCurrency,
  formatPeriod,
  isPaymentOverdue,
  getDaysUntilDue,
  getNextDuePayment
} from '@/lib/payment-utils';
import type { InstallmentPlan, User, Property } from '@/lib/types';
import { Calendar, AlertCircle, CheckCircle2, Clock, Home } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

type MonthlyPaymentCardProps = {
  plan: InstallmentPlan;
  user: User;
  property?: Property;
  onAddPayment?: () => void;
};

export default function MonthlyPaymentCard({
  plan,
  user,
  property,
  onAddPayment,
}: MonthlyPaymentCardProps) {
  const remaining = calculateRemaining(plan);
  const paidPercentage = calculatePaidPercentage(plan);
  const totalPaid = getTotalPaid(plan);
  const paidCount = getPaidInstallmentsCount(plan);
  const currentPayment = getCurrentMonthPayment(plan);
  const nextDuePayment = getNextDuePayment(plan);

  const getStatusBadge = () => {
    if (plan.status === 'completed') {
      return <Badge className="bg-green-600">Selesai</Badge>;
    }
    if (plan.status === 'cancelled') {
      return <Badge variant="destructive">Dibatalkan</Badge>;
    }
    
    if (currentPayment) {
      if (currentPayment.status === 'paid') {
        return <Badge className="bg-green-600">Terbayar</Badge>;
      }
      if (isPaymentOverdue(currentPayment)) {
        return <Badge variant="destructive">Terlambat</Badge>;
      }
      return <Badge variant="secondary">Menunggu</Badge>;
    }
    
    if (nextDuePayment) {
      const daysUntil = getDaysUntilDue(nextDuePayment);
      if (daysUntil < 0) {
        return <Badge variant="destructive">Terlambat</Badge>;
      }
      if (daysUntil <= 7) {
        return <Badge className="bg-yellow-500">Jatuh Tempo</Badge>;
      }
    }
    
    return <Badge variant="outline">Aktif</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {user.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Home className="h-3 w-3" />
                {property?.unitName || 'Unit'} {plan.unitId}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress Pembayaran</span>
            <span className="font-semibold">{paidPercentage}%</span>
          </div>
          <Progress value={paidPercentage} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Dibayar</p>
            <p className="text-lg font-semibold">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Sisa Cicilan</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(remaining)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cicilan/Bulan</p>
            <p className="text-lg font-semibold">{formatCurrency(plan.installmentAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Terbayar</p>
            <p className="text-lg font-semibold">
              {paidCount} / {plan.totalInstallments} bulan
            </p>
          </div>
        </div>

        {/* Current Payment Status */}
        {currentPayment && (
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cicilan {formatPeriod(currentPayment.period)}</span>
              {currentPayment.status === 'paid' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : isPaymentOverdue(currentPayment) ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-600" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Jatuh tempo: {formatDate(currentPayment.dueDate)}</span>
              {currentPayment.status === 'paid' && currentPayment.paymentDate && (
                <>
                  <span>•</span>
                  <span>Dibayar: {formatDate(currentPayment.paymentDate)}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Next Due Date */}
        {!currentPayment && nextDuePayment && (
          <div className="p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Jatuh tempo berikutnya:</span>
              <span className="font-medium">{formatDate(nextDuePayment.dueDate)}</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        {plan.status === 'active' && onAddPayment && (
          <Button 
            onClick={onAddPayment} 
            className="w-full"
            variant={currentPayment && isPaymentOverdue(currentPayment) ? "default" : "outline"}
          >
            {currentPayment?.status === 'paid' ? 'Lihat Detail' : 'Bayar Cicilan'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

