'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FolderKanban, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { mockProperties, mockUsers, mockProjects } from '@/lib/mock-data';
import { useMemo } from 'react';

export function DashboardStats() {
  const stats = useMemo(() => {
    const totalProperties = mockProperties.length;
    const totalUsers = mockUsers.length;
    const totalProjects = mockProjects.length;
    
    const activeProjects = mockProjects.filter(p => p.status === 'active').length;
    const closedProjects = mockProjects.filter(p => p.status === 'closed').length;
    const completedProjects = mockProjects.filter(p => p.status === 'completed').length;
    
    // Calculate payments stats
    let totalPayments = 0;
    let paidPayments = 0;
    let pendingPayments = 0;
    let overduePayments = 0;
    
    mockProjects.forEach(project => {
      if (project.installmentPlans) {
        project.installmentPlans.forEach(plan => {
          plan.payments.forEach(payment => {
            totalPayments++;
            if (payment.status === 'paid') {
              paidPayments++;
            } else if (payment.status === 'pending') {
              pendingPayments++;
            } else if (payment.status === 'overdue') {
              overduePayments++;
            }
          });
        });
      }
    });
    
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
  }, []);

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






