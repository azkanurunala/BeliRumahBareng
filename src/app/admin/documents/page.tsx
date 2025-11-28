'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { ProjectDocument } from '@/lib/types';
import { FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AllDocumentsPage() {
  const { projects } = useAdminData();
  
  const allDocuments = useMemo(() => {
    return projects.flatMap(project => 
      project.documents.map(doc => ({
        ...doc,
        projectId: project.id,
        projectName: project.propertyName,
      }))
    );
  }, [projects]);

  const columns: Column<typeof allDocuments[0]>[] = [
    {
      key: 'name',
      header: 'Nama Dokumen',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>{row.name}</span>
        </div>
      ),
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
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'Terverifikasi' ? 'default' : row.status === 'Tertanda' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Semua dokumen dari semua project
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Semua Dokumen</CardTitle>
          <CardDescription>
            Dokumen dari semua project di sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={allDocuments}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Cari dokumen..."
            actions={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}

