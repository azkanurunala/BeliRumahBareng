'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/admin/project-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import type { Project } from '@/lib/types';

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createProject, getProperty, users } = useAdminData();

  const handleSubmit = (data: any) => {
    const selectedProperty = getProperty(data.propertyId);
    if (!selectedProperty) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Property tidak ditemukan',
      });
      return;
    }

    // Get member objects from userIds
    const memberObjects = users.filter(u => data.members.includes(u.id));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      propertyId: data.propertyId,
      propertyName: selectedProperty.name,
      propertyImageUrl: selectedProperty.images[0]?.url || '',
      propertyImageHint: selectedProperty.images[0]?.hint || '',
      members: memberObjects,
      unitAssignments: data.unitAssignments,
      progress: data.progress,
      progressDetails: data.progressDetails,
      documents: [],
      messages: [],
      status: data.status,
    };
    
    createProject(newProject);
    
    toast({
      title: 'Berhasil',
      description: 'Project berhasil ditambahkan',
    });
    
    router.push('/admin/projects');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah Project Baru</h1>
        <p className="text-muted-foreground">
          Tambahkan project baru ke sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Project</CardTitle>
          <CardDescription>
            Isi informasi lengkap tentang project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/projects')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

