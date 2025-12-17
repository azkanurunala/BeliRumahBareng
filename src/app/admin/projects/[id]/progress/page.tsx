'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAdminData } from '@/contexts/admin-data-context';
import { useAuth } from '@/contexts/auth-context';
import { ArrowLeft, CheckCircle2, Clock, Calendar, Edit, Plus, Trash2, X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { ProgressDetailEditDialog } from '@/components/admin/progress/progress-detail-edit-dialog';
import { ProgressChecklistItemDialog } from '@/components/admin/progress/progress-checklist-item-dialog';
import { ProgressMilestoneDialog } from '@/components/admin/progress/progress-milestone-dialog';
import { CompletedMemberDialog } from '@/components/admin/progress/completed-member-dialog';
import { ChecklistCompleteMemberDialog } from '@/components/admin/progress/checklist-complete-member-dialog';
import { apiClient } from '@/lib/api-client';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import type { ProgressDetail, ProgressChecklistItem } from '@/lib/types';

export default function ProjectProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, loadProjects } = useAdminData();
  const { user: currentUser } = useAuth();
  
  const project = getProject(id);
  
  // State for progress detail IDs (mapping category -> progressDetailId)
  const [progressDetailIds, setProgressDetailIds] = useState<Record<string, string>>({});
  const [progressDetails, setProgressDetails] = useState<Record<string, ProgressDetail>>({});
  
  // Dialog states
  const [editDetailDialog, setEditDetailDialog] = useState<{ open: boolean; category: string }>({
    open: false,
    category: '',
  });
  const [checklistDialog, setChecklistDialog] = useState<{
    open: boolean;
    category: string;
    item?: ProgressChecklistItem;
  }>({ open: false, category: '' });
  const [milestoneDialog, setMilestoneDialog] = useState<{
    open: boolean;
    category: string;
    milestone?: { id?: string; label: string; date?: string; status: 'completed' | 'pending' | 'upcoming'; order?: number };
  }>({ open: false, category: '' });
  const [completedMemberDialog, setCompletedMemberDialog] = useState<{
    open: boolean;
    category: string;
  }>({ open: false, category: '' });
  const [deleteChecklistDialog, setDeleteChecklistDialog] = useState<{
    open: boolean;
    category: string;
    itemId: string;
  }>({ open: false, category: '', itemId: '' });
  const [deleteMilestoneDialog, setDeleteMilestoneDialog] = useState<{
    open: boolean;
    category: string;
    milestoneId: string;
  }>({ open: false, category: '', milestoneId: '' });
  
  // Load progress detail IDs
  useEffect(() => {
    const loadProgressDetailIds = async () => {
      try {
        const response = await apiClient.get('/progress-details', {
          params: { projectId: id },
        });
        
        if (response.success && response.data) {
          const ids: Record<string, string> = {};
          const details: Record<string, ProgressDetail> = {};
          
          response.data.forEach((pd: any) => {
            ids[pd.category] = pd.id;
            details[pd.category] = {
              title: pd.title,
              percentage: pd.percentage,
              description: pd.description,
              notes: pd.notes,
              checklist: pd.checklist?.map((item: any) => ({
                id: item.id,
                label: item.label,
                completedMembers: item.completedMembers || [],
                order: item.order,
              })) || [],
              completedMembers: pd.completedMembers || [],
              milestones: pd.milestones?.map((m: any) => ({
                id: m.id,
                label: m.label,
                date: m.date,
                status: m.status,
                order: m.order,
              })) || [],
            };
          });
          
          setProgressDetailIds(ids);
          setProgressDetails(details);
        }
      } catch (error) {
        console.error('Error loading progress detail IDs:', error);
      }
    };
    
    if (id) {
      loadProgressDetailIds();
    }
  }, [id]);
  
  if (!project) {
    notFound();
  }
  
  // Refresh data after update
  const refreshData = useCallback(async () => {
    await loadProjects();
    
    // Reload progress detail IDs
    try {
      const response = await apiClient.get(`/progress-details?projectId=${id}`);
      
      if (response.success && response.data) {
        const ids: Record<string, string> = {};
        const details: Record<string, ProgressDetail> = {};
        
        response.data.forEach((pd: any) => {
          ids[pd.category] = pd.id;
          details[pd.category] = {
            title: pd.title,
            percentage: pd.percentage,
            description: pd.description,
            notes: pd.notes,
            checklist: pd.checklist || [],
            completedMembers: pd.completedMembers || [],
            milestones: pd.milestones || [],
          };
        });
        
        setProgressDetailIds(ids);
        setProgressDetails(details);
      }
    } catch (error) {
      console.error('Error refreshing progress details:', error);
    }
  }, [id, loadProjects]);

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

  // Get current progress detail (from state if available, otherwise from project)
  const getCurrentDetail = (category: string): ProgressDetail => {
    return progressDetails[category] || project.progressDetails[category as keyof typeof project.progressDetails];
  };
  
  // Handler functions
  const handleCompleteChecklistItem = async (category: string, itemId: string) => {
    // Validate inputs
    if (!itemId || itemId.trim() === '') {
      toast({
        title: 'Error',
        description: 'ID checklist item tidak valid',
        variant: 'destructive',
      });
      return;
    }
    
    const progressDetailId = progressDetailIds[category];
    if (!progressDetailId) {
      toast({
        title: 'Error',
        description: 'Progress detail ID tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }
    
    // Open dialog to select member
    setChecklistCompleteDialog({
      open: true,
      category,
      itemId,
      progressDetailId,
      });
  };
  
  const handleDeleteChecklistItem = async () => {
    const { category, itemId } = deleteChecklistDialog;
    const progressDetailId = progressDetailIds[category];
    if (!progressDetailId) {
      toast({
        title: 'Error',
        description: 'Progress detail ID tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await apiClient.delete(
        `/progress-details/${progressDetailId}/checklist/${itemId}`
      );
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Checklist item berhasil dihapus',
        });
        refreshData();
        setDeleteChecklistDialog({ open: false, category: '', itemId: '' });
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menghapus checklist item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteMilestone = async () => {
    const { category, milestoneId } = deleteMilestoneDialog;
    const progressDetailId = progressDetailIds[category];
    if (!progressDetailId) {
      toast({
        title: 'Error',
        description: 'Progress detail ID tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await apiClient.delete(
        `/progress-details/${progressDetailId}/milestones/${milestoneId}`
      );
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Milestone berhasil dihapus',
        });
        refreshData();
        setDeleteMilestoneDialog({ open: false, category: '', milestoneId: '' });
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menghapus milestone',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };
  
  const handleRemoveCompletedMember = async (category: string, userId: string) => {
    const progressDetailId = progressDetailIds[category];
    if (!progressDetailId) {
      toast({
        title: 'Error',
        description: 'Progress detail ID tidak ditemukan',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await apiClient.delete(
        `/progress-details/${progressDetailId}/completed-members?userId=${userId}`
      );
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Anggota berhasil dihapus dari completed members',
        });
        refreshData();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menghapus anggota',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing completed member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const progressStages = [
    { key: 'kyc', label: 'KYC', detail: getCurrentDetail('kyc') },
    { key: 'funding', label: 'Pendanaan', detail: getCurrentDetail('funding') },
    { key: 'legal', label: 'Legal', detail: getCurrentDetail('legal') },
    { key: 'closing', label: 'Penutupan', detail: getCurrentDetail('closing') },
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
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle>{detail.title}</CardTitle>
                        {progressDetailIds[stage.key] && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditDetailDialog({ open: true, category: stage.key })}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <CardDescription>{detail.description}</CardDescription>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2 ml-4">
                      {detail.percentage}%
                    </Badge>
                  </div>
                  <Progress value={detail.percentage} className="mt-4" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Checklist */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Checklist
                      </h3>
                      {progressDetailIds[stage.key] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setChecklistDialog({ open: true, category: stage.key })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Checklist
                        </Button>
                      )}
                    </div>
                    {detail.checklist && detail.checklist.length > 0 ? (
                      <div className="space-y-2">
                        {detail.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card group"
                          >
                            <div className="mt-0.5">
                              {(item.completedMembers?.length || 0) > 0 ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${(item.completedMembers?.length || 0) > 0 ? 'line-through text-muted-foreground' : ''}`}>
                                {item.label}
                              </p>
                              {(item.completedMembers?.length || 0) > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {(item.completedMembers || []).map((userId) => (
                                    <div key={userId} className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                        <AvatarImage src={getMemberAvatar(userId)} />
                                    <AvatarFallback className="text-xs">
                                          {getMemberName(userId).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                        {getMemberName(userId)}
                                  </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {progressDetailIds[stage.key] && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(item.completedMembers?.length || 0) === 0 || !(item.completedMembers || []).includes(currentUser?.id || '') ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleCompleteChecklistItem(stage.key, item.id)}
                                    title="Tandai Selesai"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={async () => {
                                      const progressDetailId = progressDetailIds[stage.key];
                                      if (!progressDetailId || !currentUser?.id) return;
                                      try {
                                        const response = await apiClient.post(
                                          `/progress-details/${progressDetailId}/checklist/${item.id}/uncomplete`,
                                          { userId: currentUser.id }
                                        );
                                        if (response.success) {
                                          toast({
                                            title: 'Berhasil',
                                            description: 'Checklist item berhasil dibatalkan',
                                          });
                                          refreshData();
                                        }
                                      } catch (error) {
                                        console.error('Error uncompleting checklist item:', error);
                                      }
                                    }}
                                    title="Batalkan"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setChecklistDialog({ open: true, category: stage.key, item })}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteChecklistDialog({ open: true, category: stage.key, itemId: item.id })}
                                  title="Hapus"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Belum ada checklist item
                      </p>
                    )}
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Timeline
                      </h3>
                      {progressDetailIds[stage.key] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMilestoneDialog({ open: true, category: stage.key })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Milestone
                        </Button>
                      )}
                    </div>
                    {detail.milestones && detail.milestones.length > 0 ? (
                      <div className="space-y-3">
                        {detail.milestones.map((milestone, index) => {
                          // Get milestone ID from API response if available
                          const milestoneId = (milestone as any).id;
                          return (
                            <div key={milestoneId || index} className="flex items-start gap-3 group">
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
                              {progressDetailIds[stage.key] && milestoneId && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setMilestoneDialog({ open: true, category: stage.key, milestone: { ...milestone, id: milestoneId } })}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteMilestoneDialog({ open: true, category: stage.key, milestoneId })}
                                    title="Hapus"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Belum ada milestone
                      </p>
                    )}
                  </div>

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

      {/* Dialogs */}
      {progressStages.map((stage) => {
        const progressDetailId = progressDetailIds[stage.key];
        const detail = getCurrentDetail(stage.key);
        
        if (!progressDetailId) return null;
        
        return (
          <div key={stage.key}>
            {/* Edit Progress Detail Dialog */}
            <ProgressDetailEditDialog
              open={editDetailDialog.open && editDetailDialog.category === stage.key}
              onOpenChange={(open) => setEditDetailDialog({ open, category: stage.key })}
              progressDetailId={progressDetailId}
              progressDetail={detail}
              onSuccess={refreshData}
            />

            {/* Checklist Item Dialog */}
            <ProgressChecklistItemDialog
              open={checklistDialog.open && checklistDialog.category === stage.key}
              onOpenChange={(open) => setChecklistDialog({ open, category: stage.key })}
              progressDetailId={progressDetailId}
              item={checklistDialog.category === stage.key ? checklistDialog.item : undefined}
              onSuccess={refreshData}
            />

            {/* Milestone Dialog */}
            <ProgressMilestoneDialog
              open={milestoneDialog.open && milestoneDialog.category === stage.key}
              onOpenChange={(open) => setMilestoneDialog({ open, category: stage.key })}
              progressDetailId={progressDetailId}
              milestone={milestoneDialog.category === stage.key ? milestoneDialog.milestone : undefined}
              onSuccess={refreshData}
            />

            {/* Completed Member Dialog */}
            <CompletedMemberDialog
              open={completedMemberDialog.open && completedMemberDialog.category === stage.key}
              onOpenChange={(open) => setCompletedMemberDialog({ open, category: stage.key })}
              progressDetailId={progressDetailId}
              members={project.members}
              completedMemberIds={detail.completedMembers || []}
              onSuccess={refreshData}
            />

            {/* Checklist Complete Member Dialog */}
            {checklistCompleteDialog.open && checklistCompleteDialog.category === stage.key && (
              <ChecklistCompleteMemberDialog
                open={checklistCompleteDialog.open}
                onOpenChange={(open) => setChecklistCompleteDialog({ 
                  open, 
                  category: '', 
                  itemId: '', 
                  progressDetailId: '' 
                })}
                members={project.members.map(m => ({
                  id: m.id,
                  userId: m.userId,
                  name: m.name,
                  avatarUrl: m.avatarUrl,
                  email: m.email,
                }))}
                itemId={checklistCompleteDialog.itemId}
                progressDetailId={checklistCompleteDialog.progressDetailId}
                completedMembers={
                  detail.checklist?.find(item => item.id === checklistCompleteDialog.itemId)?.completedMembers || []
                }
                onSuccess={refreshData}
              />
            )}
          </div>
        );
      })}

      {/* Delete Confirm Dialogs */}
      <DeleteConfirmDialog
        open={deleteChecklistDialog.open}
        onOpenChange={(open) => setDeleteChecklistDialog({ open, category: '', itemId: '' })}
        onConfirm={handleDeleteChecklistItem}
        title="Hapus Checklist Item"
        description="Apakah Anda yakin ingin menghapus checklist item ini?"
        itemName="Checklist Item"
      />

      <DeleteConfirmDialog
        open={deleteMilestoneDialog.open}
        onOpenChange={(open) => setDeleteMilestoneDialog({ open, category: '', milestoneId: '' })}
        onConfirm={handleDeleteMilestone}
        title="Hapus Milestone"
        description="Apakah Anda yakin ingin menghapus milestone ini?"
        itemName="Milestone"
      />
    </div>
  );
}

