'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { User } from '@/lib/types';
import { Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';

export default function UsersPage() {
  const { users, deleteUser } = useAdminData();
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nama',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.avatarUrl} alt={row.name} />
            <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span>{row.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'locationPreference',
      header: 'Preferensi Lokasi',
      cell: (row) => row.profile.locationPreference,
    },
    {
      key: 'priceRange',
      header: 'Rentang Harga',
      cell: (row) => row.profile.priceRange,
    },
    {
      key: 'investmentGoals',
      header: 'Tujuan Kepemilikan',
      cell: (row) => row.profile.investmentGoals,
    },
  ];

  const handleDelete = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDelete = () => {
    if (!deleteDialog.user) return;
    
    const success = deleteUser(deleteDialog.user.id);
    if (success) {
      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'User tidak dapat dihapus karena masih menjadi anggota project',
      });
    }
    setDeleteDialog({ open: false, user: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Kelola pengguna yang terdaftar
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah User
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <DataTable
            data={users}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Cari user..."
            editUrl={(row) => `/admin/users/${row.id}`}
            viewUrl={(row) => `/admin/users/${row.id}/detail`}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        onConfirm={confirmDelete}
        title="Hapus User"
        description="Apakah Anda yakin ingin menghapus user ini?"
        itemName={deleteDialog.user?.name}
      />
    </div>
  );
}

