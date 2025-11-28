'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import { ArrowLeft, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Breadcrumb } from '@/components/admin/breadcrumb';

export default function ProjectProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject } = useAdminData();
  
  const project = getProject(id);
  
  if (!project) {
    notFound();
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  const getMemberName = (userId: string) => {
    return project.members.find(m => m.id === userId)?.name || userId;
  };

  const getMemberAvatar = (userId: string) => {
    return project.members.find(m => m.id === userId)?.avatarUrl;
  };

  const progressStages = [
    { key: 'kyc', label: 'KYC', detail: project.progressDetails.kyc },
    { key: 'funding', label: 'Pendanaan', detail: project.progressDetails.funding },
    { key: 'legal', label: 'Legal', detail: project.progressDetails.legal },
    { key: 'closing', label: 'Penutupan', detail: project.progressDetails.closing },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Progress Project</h1>
          <p className="text-muted-foreground">
            Detail progress untuk project: {project.propertyName}
          </p>
          <div className="mt-2">
            <Breadcrumb items={[
              { label: 'Projects', href: '/admin/projects' },
              { label: project.propertyName, href: `/admin/projects/${id}/detail` },
              { label: 'Progress' }
            ]} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="kyc" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {progressStages.map((stage) => (
            <TabsTrigger key={stage.key} value={stage.key}>
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {progressStages.map((stage) => {
          const detail = stage.detail;
          return (
            <TabsContent key={stage.key} value={stage.key} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{detail.title}</CardTitle>
                      <CardDescription>{detail.description}</CardDescription>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {detail.percentage}%
                    </Badge>
                  </div>
                  <Progress value={detail.percentage} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Checklist */}
                  {detail.checklist && detail.checklist.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Checklist
                      </h3>
                      <div className="space-y-2">
                        {detail.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className="mt-0.5">
                              {item.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {item.label}
                              </p>
                              {item.completed && item.completedBy && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={getMemberAvatar(item.completedBy)} />
                                    <AvatarFallback className="text-xs">
                                      {getMemberName(item.completedBy).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    {getMemberName(item.completedBy)} • {formatDate(item.completedAt)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Members */}
                  {detail.completedMembers && detail.completedMembers.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Anggota yang Sudah Menyelesaikan
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {detail.completedMembers.map((userId) => {
                          const member = project.members.find(m => m.id === userId);
                          if (!member) return null;
                          return (
                            <div
                              key={userId}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{member.name}</span>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Milestones */}
                  {detail.milestones && detail.milestones.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Timeline
                      </h3>
                      <div className="space-y-3">
                        {detail.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex flex-col items-center pt-1">
                              {milestone.status === 'completed' ? (
                                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-white" />
                                </div>
                              ) : milestone.status === 'pending' ? (
                                <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                                  <Clock className="h-5 w-5 text-white" />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-muted border-2 border-primary/30 flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              {index < detail.milestones!.length - 1 && (
                                <div
                                  className={`w-0.5 h-12 mt-1 ${
                                    milestone.status === 'completed' ? 'bg-green-600' : 'bg-muted'
                                  }`}
                                />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{milestone.label}</p>
                                <Badge
                                  variant={
                                    milestone.status === 'completed'
                                      ? 'default'
                                      : milestone.status === 'pending'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className="text-xs"
                                >
                                  {milestone.status === 'completed'
                                    ? 'Selesai'
                                    : milestone.status === 'pending'
                                    ? 'Sedang Berjalan'
                                    : 'Akan Datang'}
                                </Badge>
                              </div>
                              {milestone.date && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(milestone.date)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {detail.notes && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
                      <h3 className="font-semibold text-sm">Catatan</h3>
                      <p className="text-sm text-muted-foreground">{detail.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

