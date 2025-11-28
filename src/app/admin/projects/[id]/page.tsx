'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/admin/project-form';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CreditCard, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, updateProject } = useAdminData();
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const handleSubmit = (data: any) => {
    updateProject(id, data);
    
    toast({
      title: 'Berhasil',
      description: 'Project berhasil diperbarui',
    });
    
    router.push('/admin/projects');
  };

  const status = project.status || 'active';
  const statusLabel = status === 'completed' ? 'Selesai' : status === 'closed' ? 'Ditutup' : 'Aktif';
  const statusVariant = status === 'completed' ? 'default' : status === 'closed' ? 'secondary' : 'outline';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detail Project</h1>
          <p className="text-muted-foreground">
            Kelola project: {project.propertyName}
          </p>
        </div>
        <Badge variant={statusVariant} className="text-lg px-4 py-2">
          {statusLabel}
        </Badge>
      </div>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="edit">Edit Project</TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Dokumen
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Pembayaran
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="h-4 w-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="installments">
            <Calendar className="h-4 w-4 mr-2" />
            Cicilan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>{project.propertyName}</CardTitle>
              <CardDescription>
                Edit informasi lengkap tentang project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm
                project={project}
                onSubmit={handleSubmit}
                onCancel={() => router.push('/admin/projects')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Dokumen Project</CardTitle>
              <CardDescription>
                Kelola dokumen untuk project ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/admin/projects/${id}/documents`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Kelola Dokumen
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran Project</CardTitle>
              <CardDescription>
                Kelola pembayaran untuk project ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/admin/projects/${id}/payments`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Kelola Pembayaran
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Progress Project</CardTitle>
              <CardDescription>
                Lihat detail progress untuk project ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/admin/projects/${id}/progress`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Lihat Progress Detail
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardHeader>
              <CardTitle>Installment Plans</CardTitle>
              <CardDescription>
                Kelola rencana cicilan untuk project ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href={`/admin/projects/${id}/installments`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Kelola Installment Plans
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

