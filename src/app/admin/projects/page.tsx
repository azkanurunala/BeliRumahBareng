'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { Project } from '@/lib/types';
import { Plus, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';

export default function ProjectsPage() {
  const { projects, deleteProject } = useAdminData();
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  });

  const columns: Column<Project>[] = [
    {
      key: 'propertyName',
      header: 'Nama Property',
      sortable: true,
    },
    {
      key: 'members',
      header: 'Anggota',
      cell: (row) => `${row.members.length} orang`,
    },
    {
      key: 'unitAssignments',
      header: 'Unit',
      cell: (row) => `${row.unitAssignments.length} unit`,
    },
    {
      key: 'progress',
      header: 'Progress',
      cell: (row) => {
        const avg = Math.round(
          (row.progress.kyc + row.progress.funding + row.progress.legal + row.progress.closing) / 4
        );
        return `${avg}%`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const status = row.status || 'active';
        const variant = status === 'completed' ? 'default' : status === 'closed' ? 'secondary' : 'outline';
        const label = status === 'completed' ? 'Selesai' : status === 'closed' ? 'Ditutup' : 'Aktif';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  const handleDelete = (project: Project) => {
    setDeleteDialog({ open: true, project });
  };

  const confirmDelete = () => {
    if (!deleteDialog.project) return;
    
    const success = deleteProject(deleteDialog.project.id);
    if (success) {
      toast({
        title: 'Berhasil',
        description: 'Project berhasil dihapus',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Project tidak dapat dihapus',
      });
    }
    setDeleteDialog({ open: false, project: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Kelola proyek co-buy yang sedang berjalan
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Projects</CardTitle>
          <CardDescription>
            Semua proyek yang terdaftar di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={projects}
            columns={columns}
            searchKey="propertyName"
            searchPlaceholder="Cari project..."
            editUrl={(row) => `/admin/projects/${row.id}`}
            viewUrl={(row) => `/admin/projects/${row.id}/detail`}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, project: null })}
        onConfirm={confirmDelete}
        title="Hapus Project"
        description="Apakah Anda yakin ingin menghapus project ini? Semua data terkait (documents, payments, dll) juga akan terpengaruh."
        itemName={deleteDialog.project?.propertyName}
      />
    </div>
  );
}

