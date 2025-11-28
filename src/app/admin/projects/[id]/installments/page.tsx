'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { InstallmentPlanForm } from '@/components/admin/installment-plan-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { InstallmentPlan } from '@/lib/types';
import { Plus, ArrowLeft, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/payment-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { calculatePaidPercentage, getTotalPaid } from '@/lib/payment-utils';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function ProjectInstallmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, updateProject } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InstallmentPlan | null>(null);
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const installmentPlans = project.installmentPlans || [];

  const columns: Column<InstallmentPlan>[] = [
    {
      key: 'userId',
      header: 'User',
      cell: (row) => {
        const user = project.members.find(m => m.id === row.userId);
        return user ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}</span>
          </div>
        ) : '-';
      },
    },
    {
      key: 'unitId',
      header: 'Unit',
      cell: (row) => `Unit ${row.unitId}`,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (row) => formatCurrency(row.totalAmount),
      sortable: true,
    },
    {
      key: 'downPayment',
      header: 'Down Payment',
      cell: (row) => formatCurrency(row.downPayment),
    },
    {
      key: 'installmentAmount',
      header: 'Cicilan/Bulan',
      cell: (row) => formatCurrency(row.installmentAmount),
    },
    {
      key: 'totalInstallments',
      header: 'Total Cicilan',
      cell: (row) => `${row.totalInstallments} bulan`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'completed' ? 'default' : row.status === 'cancelled' ? 'destructive' : 'secondary';
        const label = row.status === 'completed' ? 'Selesai' : row.status === 'cancelled' ? 'Dibatalkan' : 'Aktif';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'payments',
      header: 'Progress',
      cell: (row) => {
        const percentage = calculatePaidPercentage(row);
        const totalPaid = getTotalPaid(row);
        const remaining = row.totalAmount - row.downPayment - totalPaid;
        return (
          <div className="space-y-1 min-w-[150px]">
            <div className="flex justify-between text-xs">
              <span>{percentage}%</span>
              <span>{formatCurrency(remaining)} tersisa</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        );
      },
    },
  ];

  const handleSubmit = (data: any) => {
    const installmentPlans = project.installmentPlans || [];
    
    if (editingPlan) {
      // Update
      const updatedPlans = installmentPlans.map(plan =>
        plan.id === editingPlan.id ? { ...plan, ...data } : plan
      );
      updateProject(id, { installmentPlans: updatedPlans });
    } else {
      // Create
      const newPlan: InstallmentPlan = {
        id: `plan-${Date.now()}`,
        ...data,
        payments: [],
      };
      updateProject(id, { installmentPlans: [...installmentPlans, newPlan] });
    }
    
    toast({
      title: 'Berhasil',
      description: editingPlan ? 'Installment plan berhasil diperbarui' : 'Installment plan berhasil ditambahkan',
    });
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleEdit = (plan: InstallmentPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDelete = (plan: InstallmentPlan) => {
    if (confirm(`Apakah Anda yakin ingin menghapus installment plan untuk Unit ${plan.unitId}?`)) {
      const installmentPlans = project.installmentPlans || [];
      const updatedPlans = installmentPlans.filter(p => p.id !== plan.id);
      updateProject(id, { installmentPlans: updatedPlans });
      toast({
        title: 'Berhasil',
        description: 'Installment plan berhasil dihapus',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/projects/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Installment Plans</h1>
            <p className="text-muted-foreground">
              Kelola rencana cicilan untuk project: {project.propertyName}
            </p>
            <div className="mt-2">
              <Breadcrumb items={[
                { label: 'Projects', href: '/admin/projects' },
                { label: project.propertyName, href: `/admin/projects/${id}/detail` },
                { label: 'Installment Plans' }
              ]} />
            </div>
          </div>
        </div>
        <div>
          {project.status === 'closed' || project.status === 'completed' ? (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingPlan(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Installment Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPlan ? 'Edit Installment Plan' : 'Tambah Installment Plan Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPlan ? 'Edit informasi installment plan' : 'Tambahkan installment plan baru ke project'}
                  </DialogDescription>
                </DialogHeader>
                <InstallmentPlanForm
                  installmentPlan={editingPlan || undefined}
                  projectMembers={project.members}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingPlan(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <div className="text-sm text-muted-foreground">
              Installment plans hanya dapat dibuat untuk project dengan status 'closed' atau 'completed'
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Installment Plans</CardTitle>
          <CardDescription>
            Semua rencana cicilan untuk project ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {installmentPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada installment plan</p>
              {project.status !== 'closed' && project.status !== 'completed' && (
                <p className="text-xs mt-2">
                  Installment plans akan tersedia setelah project status menjadi 'closed' atau 'completed'
                </p>
              )}
            </div>
          ) : (
            <DataTable
              data={installmentPlans}
              columns={columns}
              searchKey="userId"
              searchPlaceholder="Cari installment plan..."
              onEdit={handleEdit}
              onDelete={handleDelete}
              actions={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

