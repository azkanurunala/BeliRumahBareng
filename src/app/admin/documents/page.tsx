'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column, CustomAction } from '@/components/admin/data-table';
import { useAdminData } from '@/contexts/admin-data-context';
import type { ProjectDocument } from '@/lib/types';
import { createProjectDocument, updateProjectDocument, deleteProjectDocument } from '@/lib/actions/document.actions';
import { FileText, Plus, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DocumentForm } from '@/components/admin/document-form';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useAuth } from '@/contexts/auth-context';

type DocumentWithProject = ProjectDocument & {
  projectId: string;
  projectName: string;
};

export default function AllDocumentsPage() {
  const { projects, loadProjects } = useAdminData();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentWithProject | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithProject | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    projectId: [],
    status: [],
  });
  
  const allDocuments = useMemo(() => {
    return projects.flatMap(project => 
      project.documents.map(doc => ({
        ...doc,
        projectId: project.id,
        projectName: project.propertyName,
      }))
    );
  }, [projects]);

  // Filter data
  const filteredDocuments = useMemo(() => {
    let result = allDocuments;
    
    // Filter by project
    if (filters.projectId && filters.projectId.length > 0) {
      result = result.filter(doc => filters.projectId.includes(doc.projectId));
    }
    
    // Filter by status
    if (filters.status && filters.status.length > 0) {
      result = result.filter(doc => filters.status.includes(doc.status));
    }
    
    return result;
  }, [allDocuments, filters]);

  const columns: Column<DocumentWithProject>[] = [
    {
      key: 'name',
      header: 'Nama Dokumen',
      sortable: true,
      searchable: true,
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
      sortable: true,
      searchable: true,
      cell: (row) => (
        <Link href={`/admin/projects/${row.projectId}`} className="text-primary hover:underline">
          {row.projectName}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        const variant = row.status === 'Terverifikasi' ? 'default' : row.status === 'Tertanda' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  const handleSubmit = async (data: any) => {
    try {
      if (editingDocument) {
        // Update existing document using server action
        const updateData: any = {
          name: data.name,
          status: data.status,
          url: data.url || undefined,
          description: data.description || undefined,
          uploadedBy: data.uploadedBy || undefined,
          verifiedAt: data.verifiedAt || undefined,
        };
        
        const result = await updateProjectDocument(editingDocument.id, updateData);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Gagal memperbarui dokumen');
        }
        
        // Reload projects to get updated data
        await loadProjects();
        
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil diperbarui',
        });
      } else {
        // Create new document using server action
        if (!data.projectId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Project harus dipilih',
          });
          return;
        }

        if (!currentUser?.id) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'User tidak ditemukan. Silakan login ulang.',
          });
          return;
        }

        const createData: any = {
          projectId: data.projectId,
          name: data.name,
          status: data.status,
          url: data.url || undefined,
          description: data.description || undefined,
          uploadedBy: currentUser.id, // Otomatis dari current user
          uploadDate: new Date().toISOString(),
        };

        const result = await createProjectDocument(createData);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Gagal membuat dokumen');
        }
        
        // Reload projects to get updated data
        await loadProjects();
        
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil ditambahkan',
        });
      }
      
      setIsDialogOpen(false);
      setEditingDocument(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  };

  const handleEdit = (doc: DocumentWithProject) => {
    setEditingDocument(doc);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (doc: DocumentWithProject) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      const result = await deleteProjectDocument(documentToDelete.id);

      if (!result.success) {
        throw new Error(result.error?.message || 'Gagal menghapus dokumen');
      }

      // Reload projects to get updated data
      await loadProjects();

      toast({
        title: 'Berhasil',
        description: 'Dokumen berhasil dihapus',
      });

      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
      });
    }
  };

  const handleView = (doc: DocumentWithProject) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'URL dokumen tidak tersedia',
      });
    }
  };

  const handleDownload = (doc: DocumentWithProject) => {
    if (doc.url) {
      // Simulate download
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Berhasil',
        description: 'Download dokumen dimulai',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'URL dokumen tidak tersedia',
      });
    }
  };

  const customActions: CustomAction<DocumentWithProject>[] = [
    {
      label: 'Lihat',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => handleView(row),
      variant: 'ghost',
      size: 'icon',
    },
    {
      label: 'Download',
      icon: <Download className="h-4 w-4" />,
      onClick: (row) => handleDownload(row),
      variant: 'ghost',
      size: 'icon',
    },
    {
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row) => handleEdit(row),
      variant: 'ghost',
      size: 'icon',
    },
    {
      label: 'Hapus',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (row) => handleDeleteClick(row),
      variant: 'ghost',
      size: 'icon',
    },
  ];

  // Get project members for editing
  const getProjectMembers = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.members || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Semua dokumen dari semua project
          </p>
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
              projects={editingDocument ? undefined : projects}
              selectedProjectId={editingDocument ? undefined : undefined}
              projectMembers={editingDocument ? getProjectMembers(editingDocument.projectId) : []}
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.propertyName}
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
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                  <SelectItem value="Tertanda">Tertanda</SelectItem>
                  <SelectItem value="Terverifikasi">Terverifikasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            data={filteredDocuments}
            columns={columns}
            searchKeys={['name', 'projectName']}
            searchPlaceholder="Cari dokumen atau project..."
            actionButtons={customActions}
            actions={true}
          />
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Hapus Dokumen"
        description="Apakah Anda yakin ingin menghapus dokumen ini?"
        itemName={documentToDelete?.name}
      />
    </div>
  );
}
