'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { PaymentForm } from '@/components/admin/payment-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { MonthlyPayment, InstallmentPlan } from '@/lib/types';
import { Plus, ArrowLeft, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPeriod } from '@/lib/payment-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProjectPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, updateProject } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MonthlyPayment | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const allPayments = project.installmentPlans?.flatMap(plan => 
    plan.payments.map(payment => ({
      ...payment,
      planId: plan.id,
      userName: project.members.find(m => m.id === payment.userId)?.name || 'Unknown',
      userAvatar: project.members.find(m => m.id === payment.userId)?.avatarUrl,
    }))
  ) || [];

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

  const handleSubmit = (data: any) => {
    if (!selectedPlanId) return;
    
    const installmentPlans = project.installmentPlans || [];
    const planIndex = installmentPlans.findIndex(p => p.id === selectedPlanId);
    if (planIndex === -1) return;
    
    const updatedPlans = [...installmentPlans];
    const plan = updatedPlans[planIndex];
    
    if (editingPayment) {
      // Update payment
      const paymentIndex = plan.payments.findIndex(p => p.id === editingPayment.id);
      if (paymentIndex !== -1) {
        plan.payments[paymentIndex] = { ...editingPayment, ...data };
      }
    } else {
      // Add new payment
      const newPayment: MonthlyPayment = {
        id: `pay-${Date.now()}`,
        ...data,
      };
      plan.payments.push(newPayment);
    }
    
    updateProject(id, { installmentPlans: updatedPlans });
    
    toast({
      title: 'Berhasil',
      description: editingPayment ? 'Pembayaran berhasil diperbarui' : 'Pembayaran berhasil ditambahkan',
    });
    setIsDialogOpen(false);
    setEditingPayment(null);
    setSelectedPlanId(null);
  };

  const handleEdit = (payment: typeof allPayments[0]) => {
    setEditingPayment(payment as MonthlyPayment);
    setSelectedPlanId(payment.planId);
    setIsDialogOpen(true);
  };

  const handleDelete = (payment: typeof allPayments[0]) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pembayaran ini?`)) {
      const installmentPlans = project.installmentPlans || [];
      const planIndex = installmentPlans.findIndex(p => p.id === payment.planId);
      if (planIndex !== -1) {
        const updatedPlans = [...installmentPlans];
        updatedPlans[planIndex] = {
          ...updatedPlans[planIndex],
          payments: updatedPlans[planIndex].payments.filter(p => p.id !== payment.id),
        };
        updateProject(id, { installmentPlans: updatedPlans });
        toast({
          title: 'Berhasil',
          description: 'Pembayaran berhasil dihapus',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/admin/projects/${id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Pembayaran Project</h1>
          </div>
          <p className="text-muted-foreground">
            Kelola pembayaran untuk project: {project.propertyName}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPayment(null);
            setSelectedPlanId(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pembayaran
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Edit Pembayaran' : 'Tambah Pembayaran Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingPayment ? 'Edit informasi pembayaran' : 'Tambahkan pembayaran baru ke project'}
              </DialogDescription>
            </DialogHeader>
            <PaymentForm
              payment={editingPayment || undefined}
              projectMembers={project.members}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingPayment(null);
                setSelectedPlanId(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {project.installmentPlans && project.installmentPlans.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Semua Pembayaran</TabsTrigger>
            {project.installmentPlans.map((plan) => {
              const user = project.members.find(m => m.id === plan.userId);
              return (
                <TabsTrigger key={plan.id} value={plan.id}>
                  Unit {plan.unitId} - {user?.name}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Semua Pembayaran</CardTitle>
                <CardDescription>
                  Semua pembayaran untuk project ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={allPayments}
                  columns={columns}
                  searchKey="userName"
                  searchPlaceholder="Cari pembayaran..."
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  actions={true}
                />
              </CardContent>
            </Card>
          </TabsContent>
          {project.installmentPlans.map((plan) => {
            const planPayments = allPayments.filter(p => p.planId === plan.id);
            return (
              <TabsContent key={plan.id} value={plan.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>Pembayaran Unit {plan.unitId}</CardTitle>
                    <CardDescription>
                      {project.members.find(m => m.id === plan.userId)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={planPayments}
                      columns={columns}
                      searchKey="userName"
                      searchPlaceholder="Cari pembayaran..."
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      actions={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      {(!project.installmentPlans || project.installmentPlans.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pembayaran</CardTitle>
            <CardDescription>
              Belum ada installment plan untuk project ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Installment plans akan muncul setelah project status menjadi 'closed' atau 'completed'
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

