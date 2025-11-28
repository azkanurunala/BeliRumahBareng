'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/admin/data-table';
import { DocumentForm } from '@/components/admin/document-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { ProjectDocument } from '@/lib/types';
import { Plus, ArrowLeft, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function ProjectDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, updateProject } = useAdminData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ProjectDocument | null>(null);
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const documents = project.documents;

  const columns: Column<ProjectDocument>[] = [
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
      key: 'status',
      header: 'Status',
      cell: (row) => {
        const variant = row.status === 'Terverifikasi' ? 'default' : row.status === 'Tertanda' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'uploadedBy',
      header: 'Diupload Oleh',
      cell: (row) => {
        const user = project.members.find(m => m.id === row.uploadedBy);
        return user ? user.name : '-';
      },
    },
    {
      key: 'signedBy',
      header: 'Ditandatangani',
      cell: (row) => {
        if (!row.signedBy || row.signedBy.length === 0) return '-';
        return `${row.signedBy.length} orang`;
      },
    },
  ];

  const handleSubmit = (data: any) => {
    if (editingDocument) {
      // Update
      const updatedDocuments = documents.map(doc => 
        doc.id === editingDocument.id 
          ? { ...doc, ...data, id: doc.id }
          : doc
      );
      updateProject(id, { documents: updatedDocuments });
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil diperbarui',
      });
    } else {
      // Create
      const newDoc: ProjectDocument = {
        id: `doc-${Date.now()}`,
        ...data,
        uploadDate: new Date().toISOString(),
      };
      updateProject(id, { documents: [...documents, newDoc] });
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil ditambahkan',
      });
    }
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  const handleEdit = (doc: ProjectDocument) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const handleDelete = (doc: ProjectDocument) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${doc.name}"?`)) {
      const updatedDocuments = documents.filter(d => d.id !== doc.id);
      updateProject(id, { documents: updatedDocuments });
      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil dihapus',
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
            <h1 className="text-3xl font-bold tracking-tight">Dokumen Project</h1>
            <p className="text-muted-foreground">
              Kelola dokumen untuk project: {project.propertyName}
            </p>
            <div className="mt-2">
              <Breadcrumb items={[
                { label: 'Projects', href: '/admin/projects' },
                { label: project.propertyName, href: `/admin/projects/${id}/detail` },
                { label: 'Dokumen' }
              ]} />
            </div>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingDocument(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Dokumen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingDocument ? 'Edit informasi dokumen' : 'Tambahkan dokumen baru ke project'}
              </DialogDescription>
            </DialogHeader>
            <DocumentForm
              document={editingDocument || undefined}
              projectMembers={project.members}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingDocument(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Dokumen</CardTitle>
          <CardDescription>
            Semua dokumen untuk project ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={documents}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Cari dokumen..."
            onEdit={handleEdit}
            onDelete={handleDelete}
            actions={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

