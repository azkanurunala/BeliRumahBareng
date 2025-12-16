'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { Property } from '@/lib/types';
import { Plus, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/payment-utils';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { normalizeUnitMeasure } from '@/lib/utils';

export default function PropertiesPage() {
  const { properties, deleteProperty } = useAdminData();
  const { toast } = useToast();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; property: Property | null }>({
    open: false,
    property: null,
  });

  const columns: Column<Property>[] = [
    {
      key: 'name',
      header: 'Nama',
      sortable: true,
    },
    {
      key: 'type',
      header: 'Tipe',
      cell: (row) => (
        <Badge variant={row.type === 'co-building' ? 'default' : 'secondary'}>
          {row.type === 'co-building' ? 'Co-Building' : 'Co-Owning'}
        </Badge>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      sortable: true,
    },
    {
      key: 'price',
      header: 'Harga',
      cell: (row) => formatCurrency(row.price),
      sortable: true,
    },
    {
      key: 'totalUnits',
      header: 'Unit',
      cell: (row) => {
        // Untuk Co-Building: gunakan totalUnits + unitName
        if (row.type === 'co-building' && row.totalUnits) {
          return `${row.totalUnits} ${row.unitName}`;
        }
        
        // Untuk Co-Owning: gunakan totalArea/unitSize + unitMeasure
        if (row.type === 'co-owning') {
          const value = row.totalArea || row.unitSize;
          if (value) {
            return `${value} ${normalizeUnitMeasure(row.unitMeasure)}`;
          }
        }
        
        return '-';
      },
    },
  ];

  const handleDelete = (property: Property) => {
    setDeleteDialog({ open: true, property });
  };

  const confirmDelete = () => {
    if (!deleteDialog.property) return;
    
    const success = deleteProperty(deleteDialog.property.id);
    if (success) {
      toast({
        title: 'Berhasil',
        description: 'Property berhasil dihapus',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: 'Property tidak dapat dihapus karena masih digunakan di project',
      });
    }
    setDeleteDialog({ open: false, property: null });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Kelola properti yang tersedia untuk co-buy
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Property
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          <DataTable
            data={properties}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Cari properti..."
            editUrl={(row) => `/admin/properties/${row.id}`}
            viewUrl={(row) => `/admin/properties/${row.id}/detail`}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, property: null })}
        onConfirm={confirmDelete}
        title="Hapus Property"
        description="Apakah Anda yakin ingin menghapus property ini?"
        itemName={deleteDialog.property?.name}
      />
    </div>
  );
}

