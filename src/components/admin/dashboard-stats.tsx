'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FolderKanban, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAdminData } from '@/contexts/admin-data-context';
import { useMemo } from 'react';

export function DashboardStats() {
  const { properties, users, projects } = useAdminData();
  
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const totalUsers = users.length;
    const totalProjects = projects.length;
    
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const closedProjects = projects.filter(p => p.status === 'closed').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    // Calculate payments stats from projects
    // Note: Payment stats would need to be calculated from PaymentPlan and Payment tables
    // For now, we'll set them to 0 as they need to be fetched separately
    const totalPayments = 0;
    const paidPayments = 0;
    const pendingPayments = 0;
    const overduePayments = 0;
    
    return {
      totalProperties,
      totalUsers,
      totalProjects,
      activeProjects,
      closedProjects,
      completedProjects,
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
    };
  }, [properties, users, projects]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProperties}</div>
          <p className="text-xs text-muted-foreground">
            Properti tersedia
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Pengguna terdaftar
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeProjects} aktif, {stats.closedProjects} ditutup, {stats.completedProjects} selesai
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPayments}</div>
          <p className="text-xs text-muted-foreground">
            {stats.paidPayments} terbayar, {stats.pendingPayments} menunggu, {stats.overduePayments} terlambat
          </p>
        </CardContent>
      </Card>
    </div>
  );
}






