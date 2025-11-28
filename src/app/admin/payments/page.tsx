'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { MonthlyPayment } from '@/lib/types';
import { CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPeriod } from '@/lib/payment-utils';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function AllPaymentsPage() {
  const { projects } = useAdminData();
  const [filters, setFilters] = useState<Record<string, string[]>>({
    userId: [],
    projectId: [],
    period: [],
    status: [],
  });
  
  const allPayments = useMemo(() => {
    const payments: (MonthlyPayment & { projectName: string; userName: string; userAvatar?: string; projectId: string })[] = [];
    
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
              projectId: project.id,
            });
          });
        });
      }
    });
    
    return payments;
  }, [projects]);

  // Get unique values for filters
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string; avatar?: string }>();
    allPayments.forEach(payment => {
      if (!userMap.has(payment.userId)) {
        userMap.set(payment.userId, {
          id: payment.userId,
          name: payment.userName,
          avatar: payment.userAvatar,
        });
      }
    });
    return Array.from(userMap.values());
  }, [allPayments]);

  const uniqueProjects = useMemo(() => {
    const projectMap = new Map<string, { id: string; name: string }>();
    allPayments.forEach(payment => {
      if (!projectMap.has(payment.projectId)) {
        projectMap.set(payment.projectId, {
          id: payment.projectId,
          name: payment.projectName,
        });
      }
    });
    return Array.from(projectMap.values());
  }, [allPayments]);

  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    allPayments.forEach(payment => {
      if (payment.period) {
        periods.add(payment.period);
      }
    });
    return Array.from(periods).sort().reverse(); // Latest first
  }, [allPayments]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let result = allPayments;

    // User filter
    if (filters.userId && filters.userId.length > 0) {
      result = result.filter((p) => filters.userId.includes(p.userId));
    }

    // Project filter
    if (filters.projectId && filters.projectId.length > 0) {
      result = result.filter((p) => filters.projectId.includes(p.projectId));
    }

    // Period filter
    if (filters.period && filters.period.length > 0) {
      result = result.filter((p) => filters.period.includes(p.period));
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter((p) => filters.status.includes(p.status));
    }

    return result;
  }, [allPayments, filters]);

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

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Pembeli</label>
              <Select
                value={filters.userId?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    userId: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Pembeli" />
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
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Project</label>
              <Select
                value={filters.projectId?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    projectId: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Project</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Periode</label>
              <Select
                value={filters.period?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    period: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Periode</SelectItem>
                  {uniquePeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {formatPeriod(period)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    status: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="paid">Terbayar</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="overdue">Terlambat</SelectItem>
                  <SelectItem value="partial">Sebagian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            data={filteredPayments}
            columns={columns}
            searchKeys={['userName', 'projectName']}
            searchPlaceholder="Cari pembayaran..."
            actions={false}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardContent>
      </Card>
    </div>
  );
}

