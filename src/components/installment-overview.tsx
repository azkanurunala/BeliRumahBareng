'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InstallmentPlan } from '@/lib/types';
import {
  calculateRemaining,
  getTotalPaid,
  getPaidInstallmentsCount,
  getOverduePayments,
  formatCurrency,
} from '@/lib/payment-utils';
import { TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';

type InstallmentOverviewProps = {
  plans: InstallmentPlan[];
};

export default function InstallmentOverview({ plans }: InstallmentOverviewProps) {
  const activePlans = plans.filter(p => p.status === 'active');
  const completedPlans = plans.filter(p => p.status === 'completed');
  
  // Calculate totals across all plans
  const totalAmount = plans.reduce((sum, plan) => sum + plan.totalAmount, 0);
  const totalDownPayment = plans.reduce((sum, plan) => sum + plan.downPayment, 0);
  const totalPaid = plans.reduce((sum, plan) => sum + getTotalPaid(plan), 0);
  const totalRemaining = plans.reduce((sum, plan) => sum + calculateRemaining(plan), 0);
  
  const totalInstallments = plans.reduce((sum, plan) => sum + plan.totalInstallments, 0);
  const totalPaidInstallments = plans.reduce((sum, plan) => sum + getPaidInstallmentsCount(plan), 0);
  
  const overduePayments = plans.flatMap(plan => getOverduePayments(plan));
  const totalOverdue = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const overallProgress = totalAmount > 0 
    ? Math.round(((totalDownPayment + totalPaid) / totalAmount) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          Ringkasan Cicilan
        </CardTitle>
        <CardDescription>Overview pembayaran cicilan untuk semua unit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-sm">
              {activePlans.length} Cicilan Aktif
            </Badge>
            <Badge variant="outline" className="text-sm">
              {completedPlans.length} Selesai
            </Badge>
            {overduePayments.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                {overduePayments.length} Terlambat
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Amount */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Nilai
                </p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>

            {/* Total Paid */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Total Dibayar
                </p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalDownPayment + totalPaid)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {overallProgress}% dari total
              </p>
            </div>

            {/* Remaining */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Sisa Cicilan
                </p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalRemaining)}</p>
            </div>

            {/* Overdue */}
            {totalOverdue > 0 ? (
              <div className="p-4 rounded-lg border bg-destructive/10 border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Terlambat
                  </p>
                </div>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalOverdue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overduePayments.length} pembayaran
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Progress
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {totalPaidInstallments} / {totalInstallments}
                </p>
                <p className="text-xs text-muted-foreground mt-1">bulan terbayar</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress Keseluruhan</span>
              <span className="font-semibold">{overallProgress}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>DP: {formatCurrency(totalDownPayment)}</span>
              <span>Cicilan: {formatCurrency(totalPaid)}</span>
              <span>Sisa: {formatCurrency(totalRemaining)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

