'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { MonthlyPayment } from '@/lib/types';
import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPeriod } from '@/lib/payment-utils';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AllPaymentsPage() {
  const { projects } = useAdminData();
  
  const allPayments = useMemo(() => {
    const payments: (MonthlyPayment & { projectName: string; userName: string; userAvatar?: string })[] = [];
    
    projects.forEach(project => {
      if (project.installmentPlans) {
        project.installmentPlans.forEach(plan => {
          const user = project.members.find(m => m.id === plan.userId);
          plan.payments.forEach(payment => {
            payments.push({
              ...payment,
              projectName: project.propertyName,
              userName: user?.name || 'Unknown',
              userAvatar: user?.avatarUrl,
            });
          });
        });
      }
    });
    
    return payments;
  }, [projects]);

  const columns: Column<typeof allPayments[0]>[] = [
    {
      key: 'userName',
      header: 'Pembeli',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.userAvatar && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.userAvatar} alt={row.userName} />
              <AvatarFallback>{row.userName.charAt(0)}</AvatarFallback>
            </Avatar>
          )}
          <span>{row.userName}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'projectName',
      header: 'Project',
      cell: (row) => (
        <Link href={`/admin/projects/${row.projectId}`} className="text-primary hover:underline">
          {row.projectName}
        </Link>
      ),
      sortable: true,
    },
    {
      key: 'unitId',
      header: 'Unit',
      cell: (row) => `Unit ${row.unitId}`,
    },
    {
      key: 'period',
      header: 'Periode',
      cell: (row) => formatPeriod(row.period),
      sortable: true,
    },
    {
      key: 'amount',
      header: 'Jumlah',
      cell: (row) => formatCurrency(row.amount),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'paid' ? 'default' : row.status === 'overdue' ? 'destructive' : 'secondary';
        const label = row.status === 'paid' ? 'Terbayar' : row.status === 'overdue' ? 'Terlambat' : row.status === 'partial' ? 'Sebagian' : 'Menunggu';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'paymentDate',
      header: 'Tanggal Bayar',
      cell: (row) => row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('id-ID') : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Semua pembayaran dari semua project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Pembayaran</CardTitle>
          <CardDescription>
            Pembayaran dari semua project di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={allPayments}
            columns={columns}
            searchKey="userName"
            searchPlaceholder="Cari pembayaran..."
            actions={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

