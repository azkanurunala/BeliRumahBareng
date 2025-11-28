'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft, Edit, FolderKanban, Users, Home, FileText, CreditCard, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/payment-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getProject, getProperty } = useAdminData();
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const property = getProperty(project.propertyId);
  const status = project.status || 'active';
  const statusLabel = status === 'completed' ? 'Selesai' : status === 'closed' ? 'Ditutup' : 'Aktif';
  const statusVariant = status === 'completed' ? 'default' : status === 'closed' ? 'secondary' : 'outline';
  
  const overallProgress = Math.round(
    (project.progress.kyc + project.progress.funding + project.progress.legal + project.progress.closing) / 4
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{project.propertyName}</h1>
            <p className="text-muted-foreground">
              Detail informasi project
            </p>
            <div className="mt-2">
              <Breadcrumb items={[
                { label: 'Projects', href: '/admin/projects' },
                { label: project.propertyName }
              ]} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant} className="text-lg px-4 py-2">
            {statusLabel}
          </Badge>
          <Button asChild>
            <Link href={`/admin/projects/${id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Property Image */}
          <Card>
            <div className="relative h-64 w-full">
              <Image
                src={project.propertyImageUrl}
                alt={project.propertyName}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={project.propertyImageHint}
              />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{property?.location || 'Lokasi'}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress Keseluruhan</span>
                  <span className="text-lg font-bold text-primary">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">KYC</span>
                    <span className="font-medium">{project.progress.kyc}%</span>
                  </div>
                  <Progress value={project.progress.kyc} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pendanaan</span>
                    <span className="font-medium">{project.progress.funding}%</span>
                  </div>
                  <Progress value={project.progress.funding} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Legal</span>
                    <span className="font-medium">{project.progress.legal}%</span>
                  </div>
                  <Progress value={project.progress.legal} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Penutupan</span>
                    <span className="font-medium">{project.progress.closing}%</span>
                  </div>
                  <Progress value={project.progress.closing} className="h-2" />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/projects/${id}/progress`}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Detail Progress
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Unit Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Alokasi Unit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.unitAssignments.map((assignment, index) => {
                    const member = project.members.find(m => m.id === assignment.userId);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {member ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{member.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {property?.unitName || 'Unit'} {assignment.unitId}
                          </span>
                          {assignment.size && (
                            <span className="text-xs text-muted-foreground block">
                              ~{assignment.size}{property?.unitMeasure}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(assignment.price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Documents Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dokumen
              </CardTitle>
              <CardDescription>
                {project.documents.length} dokumen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 rounded border">
                    <span className="text-sm font-medium">{doc.name}</span>
                    <Badge variant={doc.status === 'Terverifikasi' ? 'default' : doc.status === 'Tertanda' ? 'secondary' : 'outline'}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
                {project.documents.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/admin/projects/${id}/documents`}>
                      Lihat Semua Dokumen
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Total Anggota</span>
                </div>
                <p className="text-2xl font-bold">{project.members.length} orang</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>Total Unit</span>
                </div>
                <p className="text-2xl font-bold">{project.unitAssignments.length} unit</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Dokumen</span>
                </div>
                <p className="text-2xl font-bold">{project.documents.length}</p>
              </div>
              {project.installmentPlans && project.installmentPlans.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Installment Plans</span>
                  </div>
                  <p className="text-2xl font-bold">{project.installmentPlans.length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/projects/${id}/documents`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Kelola Dokumen
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/projects/${id}/payments`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Kelola Pembayaran
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/admin/projects/${id}/progress`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Detail Progress
                </Link>
              </Button>
              {project.status === 'closed' || project.status === 'completed' ? (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/admin/projects/${id}/installments`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Kelola Cicilan
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

