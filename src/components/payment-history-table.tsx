'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MonthlyPayment, User, Property } from '@/lib/types';
import { formatCurrency, formatPeriod, isPaymentOverdue } from '@/lib/payment-utils';
import { Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

type PaymentHistoryTableProps = {
  payments: MonthlyPayment[];
  members: User[];
  property?: Property;
  onViewReceipt?: (payment: MonthlyPayment) => void;
};

export default function PaymentHistoryTable({
  payments,
  members,
  property,
  onViewReceipt,
}: PaymentHistoryTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'period' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique users from payments
  const uniqueUserIds = Array.from(new Set(payments.map(p => p.userId)));
  const uniqueUsers = uniqueUserIds
    .map(userId => members.find(m => m.id === userId))
    .filter((user): user is User => user !== undefined);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (payment: MonthlyPayment) => {
    const status = payment.status === 'paid' 
      ? 'paid' 
      : isPaymentOverdue(payment) 
      ? 'overdue' 
      : 'pending';

    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-600 flex items-center gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" />
            Terbayar
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Terlambat
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Menunggu
          </Badge>
        );
    }
  };

  const filteredAndSortedPayments = useMemo(() => {
    let filtered = payments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'paid') return p.status === 'paid';
        if (statusFilter === 'overdue') return isPaymentOverdue(p);
        if (statusFilter === 'pending') return p.status === 'pending' && !isPaymentOverdue(p);
        return true;
      });
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(p => p.userId === userFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.paymentDate || a.dueDate).getTime() - 
                      new Date(b.paymentDate || b.dueDate).getTime();
          break;
        case 'period':
          comparison = a.period.localeCompare(b.period);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [payments, statusFilter, userFilter, sortBy, sortOrder]);

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembayaran</CardTitle>
          <CardDescription>History pembayaran cicilan bulanan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada riwayat pembayaran</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Riwayat Pembayaran
            </CardTitle>
            <CardDescription>History pembayaran cicilan bulanan</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter Pembeli" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pembeli</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="paid">Terbayar</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [by, order] = value.split('-');
              setSortBy(by as 'date' | 'period' | 'amount');
              setSortOrder(order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Terbaru</SelectItem>
                <SelectItem value="date-asc">Terlama</SelectItem>
                <SelectItem value="period-desc">Periode (Z-A)</SelectItem>
                <SelectItem value="period-asc">Periode (A-Z)</SelectItem>
                <SelectItem value="amount-desc">Jumlah (Tertinggi)</SelectItem>
                <SelectItem value="amount-asc">Jumlah (Terendah)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pembeli</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPayments.map((payment) => {
                const user = members.find(m => m.id === payment.userId);
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {user ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatarUrl} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{user.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {property?.unitName || 'Unit'} {payment.unitId}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPeriod(payment.period)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(payment.dueDate)}</span>
                    </TableCell>
                    <TableCell>
                      {payment.paymentDate ? (
                        <span className="text-sm">{formatDate(payment.paymentDate)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment)}</TableCell>
                    <TableCell>
                      {payment.paymentMethod ? (
                        <span className="text-sm capitalize">{payment.paymentMethod}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.receiptUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewReceipt?.(payment)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Bukti
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filteredAndSortedPayments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tidak ada pembayaran dengan status yang dipilih</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

