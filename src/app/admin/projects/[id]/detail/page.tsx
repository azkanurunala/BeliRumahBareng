'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdminData } from '@/contexts/admin-data-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, FolderKanban, Users, Home, FileText, CreditCard, TrendingUp, Calendar, MapPin, CheckCircle2, Clock, Plus, Trash2, X, Check, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/payment-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { normalizeUnitMeasure } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProgressDetailEditDialog } from '@/components/admin/progress/progress-detail-edit-dialog';
import { ProgressChecklistItemDialog } from '@/components/admin/progress/progress-checklist-item-dialog';
import { ProgressMilestoneDialog } from '@/components/admin/progress/progress-milestone-dialog';
import { CompletedMemberDialog } from '@/components/admin/progress/completed-member-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { UnitAssignmentDialog } from '@/components/admin/unit-assignment-dialog';
import { DocumentForm } from '@/components/admin/document-form';
import DocumentDetailDialog from '@/components/document-detail-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { addUnitAssignment, removeUnitAssignment } from '@/lib/actions/project.actions';
import { createProjectDocument, updateProjectDocument, deleteProjectDocument } from '@/lib/actions/document.actions';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import type { ProgressDetail, ProgressChecklistItem, UnitAssignment, ProjectDocument } from '@/lib/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { getProject, getProperty, loadProjects } = useAdminData();
  const { user: currentUser } = useAuth();
  
  const project = getProject(id);
  
  // State for progress detail IDs (mapping category -> progressDetailId)
  const [progressDetailIds, setProgressDetailIds] = useState<Record<string, string>>({});
  const [progressDetails, setProgressDetails] = useState<Record<string, ProgressDetail>>({});
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  
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
  
  // Unit Assignment dialog states
  const [unitAssignmentDialog, setUnitAssignmentDialog] = useState<{
    open: boolean;
    assignment?: UnitAssignment & { unitId: number };
  }>({ open: false });
  const [deleteUnitAssignmentDialog, setDeleteUnitAssignmentDialog] = useState<{
    open: boolean;
    unitId: number;
  }>({ open: false, unitId: 0 });
  
  // Document dialog states
  const [documentDialog, setDocumentDialog] = useState<{
    open: boolean;
    document?: ProjectDocument;
  }>({ open: false });
  const [documentDetailDialog, setDocumentDetailDialog] = useState<{
    open: boolean;
    document?: ProjectDocument;
  }>({ open: false });
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState<{
    open: boolean;
    documentId: string;
  }>({ open: false, documentId: '' });
  
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
                completed: item.completed,
                completedBy: item.completedBy,
                completedAt: item.completedAt,
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

  const property = getProperty(project.propertyId);
  const status = project.status || 'active';
  const statusLabel = status === 'completed' ? 'Selesai' : status === 'closed' ? 'Ditutup' : 'Aktif';
  const statusVariant = status === 'completed' ? 'default' : status === 'closed' ? 'secondary' : 'outline';
  
  const overallProgress = Math.round(
    (project.progress.kyc + project.progress.funding + project.progress.legal + project.progress.closing) / 4
  );
  
  // Refresh data after update
  const refreshData = useCallback(async () => {
    await loadProjects();
    
    // Reload progress detail IDs
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
              completed: item.completed,
              completedBy: item.completedBy,
              completedAt: item.completedAt,
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
  
  // Ensure progress detail exists, create if not
  const ensureProgressDetail = useCallback(async (category: string): Promise<string | null> => {
    // Check if already exists
    if (progressDetailIds[category]) {
      return progressDetailIds[category];
    }

    // Create with default values
    const categoryLabels: Record<string, string> = {
      kyc: 'KYC',
      funding: 'Pendanaan',
      legal: 'Legal',
      closing: 'Penutupan',
    };

    try {
      const response = await apiClient.post('/progress-details', {
        projectId: id,
        category: category,
        title: categoryLabels[category] || category,
        percentage: 0,
        description: `Progress detail untuk ${categoryLabels[category] || category}`,
      });

      if (response.success && response.data) {
        const newProgressDetailId = response.data.id;
        
        // Update state immediately
        setProgressDetailIds(prev => ({
          ...prev,
          [category]: newProgressDetailId,
        }));
        
        // Update progressDetails state with new data
        setProgressDetails(prev => ({
          ...prev,
          [category]: {
            title: response.data.title,
            percentage: response.data.percentage,
            description: response.data.description,
            notes: response.data.notes,
            checklist: [],
            completedMembers: [],
            milestones: [],
          },
        }));
        
        // Refresh data to get the complete progress detail
        await refreshData();
        return newProgressDetailId;
      }
      return null;
    } catch (error) {
      console.error('Error creating progress detail:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat progress detail',
        variant: 'destructive',
      });
      return null;
    }
  }, [id, progressDetailIds, refreshData, toast]);
  
  // Handler functions
  const handleCompleteChecklistItem = async (category: string, itemId: string) => {
    let progressDetailId = progressDetailIds[category];
    
    // Ensure progress detail exists
    if (!progressDetailId) {
      progressDetailId = await ensureProgressDetail(category);
      if (!progressDetailId) {
        return;
      }
    }
    
    if (!currentUser?.id) {
      toast({
        title: 'Error',
        description: 'User tidak ditemukan. Silakan login ulang.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await apiClient.post(
        `/progress-details/${progressDetailId}/checklist/${itemId}/complete`,
        { completedBy: currentUser.id }
      );
      
      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Checklist item berhasil ditandai sebagai selesai',
        });
        refreshData();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menandai checklist item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error completing checklist item:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteChecklistItem = async () => {
    const { category, itemId } = deleteChecklistDialog;
    let progressDetailId = progressDetailIds[category];
    
    // Ensure progress detail exists
    if (!progressDetailId) {
      progressDetailId = await ensureProgressDetail(category);
      if (!progressDetailId) {
        return;
      }
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
    let progressDetailId = progressDetailIds[category];
    
    // Ensure progress detail exists
    if (!progressDetailId) {
      progressDetailId = await ensureProgressDetail(category);
      if (!progressDetailId) {
        return;
      }
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
    let progressDetailId = progressDetailIds[category];
    
    // Ensure progress detail exists
    if (!progressDetailId) {
      progressDetailId = await ensureProgressDetail(category);
      if (!progressDetailId) {
        return;
      }
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

  // Unit Assignment handlers
  const handleDeleteUnitAssignment = async () => {
    const { unitId } = deleteUnitAssignmentDialog;
    try {
      const result = await removeUnitAssignment(id, unitId);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Unit assignment berhasil dihapus',
        });
        await refreshData();
        setDeleteUnitAssignmentDialog({ open: false, unitId: 0 });
      } else {
        toast({
          title: 'Gagal',
          description: result.error?.message || 'Gagal menghapus unit assignment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting unit assignment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  // Document handlers
  const handleCreateDocument = async (data: any) => {
    try {
      const result = await createProjectDocument({
        ...data,
        projectId: id,
        uploadDate: data.uploadDate || new Date().toISOString(),
      });
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil ditambahkan',
        });
        await refreshData();
      } else {
        toast({
          title: 'Gagal',
          description: result.error?.message || 'Gagal menambahkan dokumen',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDocument = async (documentId: string, data: any) => {
    try {
      const result = await updateProjectDocument(documentId, data);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil diupdate',
        });
        await refreshData();
      } else {
        toast({
          title: 'Gagal',
          description: result.error?.message || 'Gagal mengupdate dokumen',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async () => {
    const { documentId } = deleteDocumentDialog;
    try {
      const result = await deleteProjectDocument(documentId);
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil dihapus',
        });
        await refreshData();
        setDeleteDocumentDialog({ open: false, documentId: '' });
      } else {
        toast({
          title: 'Gagal',
          description: result.error?.message || 'Gagal menghapus dokumen',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
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

              {/* Expandable Progress Detail Section */}
              <Collapsible open={isProgressExpanded} onOpenChange={setIsProgressExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {isProgressExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Sembunyikan Detail & Edit Progress
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Lihat Detail & Edit Progress
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
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
                        <TabsContent key={stage.key} value={stage.key} className="space-y-4 mt-4">
                          <Card>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <CardTitle className="text-lg">{detail.title}</CardTitle>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        await ensureProgressDetail(stage.key);
                                        setEditDetailDialog({ open: true, category: stage.key });
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      await ensureProgressDetail(stage.key);
                                      setChecklistDialog({ open: true, category: stage.key });
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Checklist
                                  </Button>
                                </div>
                                {detail.checklist && detail.checklist.length > 0 ? (
                                  <div className="space-y-2">
                                    {detail.checklist.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-start gap-3 p-3 rounded-lg border bg-card group"
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
                                        <div className="flex items-center gap-1">
                                          {!item.completed && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handleCompleteChecklistItem(stage.key, item.id)}
                                              title="Tandai Selesai"
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={async () => {
                                              await ensureProgressDetail(stage.key);
                                              setChecklistDialog({ open: true, category: stage.key, item });
                                            }}
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
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    Belum ada checklist item
                                  </p>
                                )}
                              </div>

                              {/* Completed Members */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    Anggota yang Sudah Menyelesaikan
                                  </h3>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      await ensureProgressDetail(stage.key);
                                      setCompletedMemberDialog({ open: true, category: stage.key });
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tandai Selesai
                                  </Button>
                                </div>
                                {detail.completedMembers && detail.completedMembers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {detail.completedMembers.map((userId) => {
                                      const member = project.members.find(m => m.id === userId);
                                      if (!member) return null;
                                      return (
                                        <div
                                          key={userId}
                                          className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card group"
                                        >
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium">{member.name}</span>
                                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                            onClick={() => handleRemoveCompletedMember(stage.key, userId)}
                                            title="Hapus"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    Belum ada anggota yang menyelesaikan
                                  </p>
                                )}
                              </div>

                              {/* Milestones */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                                    Timeline
                                  </h3>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      await ensureProgressDetail(stage.key);
                                      setMilestoneDialog({ open: true, category: stage.key });
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Milestone
                                  </Button>
                                </div>
                                {detail.milestones && detail.milestones.length > 0 ? (
                                  <div className="space-y-3">
                                    {detail.milestones.map((milestone, index) => {
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
                                          {milestoneId && (
                                            <div className="flex items-center gap-1 pt-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={async () => {
                                                  await ensureProgressDetail(stage.key);
                                                  setMilestoneDialog({ open: true, category: stage.key, milestone: { ...milestone, id: milestoneId } });
                                                }}
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
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Unit Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Alokasi Unit
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUnitAssignmentDialog({ open: true })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Unit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.unitAssignments.length > 0 ? (
                    project.unitAssignments.map((assignment, index) => {
                      const member = project.members.find(m => m.id === assignment.userId);
                      return (
                        <TableRow key={index} className="group">
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
                                ~{assignment.size} {normalizeUnitMeasure(property?.unitMeasure)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(assignment.price)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setUnitAssignmentDialog({ open: true, assignment: { ...assignment, unitId: assignment.unitId } })}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteUnitAssignmentDialog({ open: true, unitId: assignment.unitId })}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                        Belum ada unit assignment
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Documents Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Dokumen
                  </CardTitle>
                  <CardDescription>
                    {project.documents.length} dokumen
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocumentDialog({ open: true })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Dokumen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.documents.length > 0 ? (
                  <>
                    {project.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded border group">
                        <span className="text-sm font-medium">{doc.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.status === 'Terverifikasi' ? 'default' : doc.status === 'Tertanda' ? 'secondary' : 'outline'}>
                            {doc.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDocumentDetailDialog({ open: true, document: doc })}
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDocumentDialog({ open: true, document: doc })}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteDocumentDialog({ open: true, documentId: doc.id })}
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {project.documents.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/admin/projects/${id}/documents`}>
                          Lihat Semua Dokumen
                        </Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Belum ada dokumen
                  </p>
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

      {/* Progress Dialogs */}
      {progressStages.map((stage) => {
        const progressDetailId = progressDetailIds[stage.key];
        const detail = getCurrentDetail(stage.key);
        
        // Only render dialogs if progressDetailId exists
        // ProgressDetailId will be created by ensureProgressDetail before dialog opens
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

      {/* Unit Assignment Dialog */}
      <UnitAssignmentDialog
        open={unitAssignmentDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setUnitAssignmentDialog({ open: false });
          }
        }}
        projectId={id}
        members={project.members}
        assignment={unitAssignmentDialog.assignment}
        property={property || undefined}
        assignedUnitIds={
          // Get assigned unit IDs, exclude current unit if editing
          project.unitAssignments
            .filter(assignment => 
              !unitAssignmentDialog.assignment || 
              assignment.unitId !== unitAssignmentDialog.assignment.unitId
            )
            .map(assignment => assignment.unitId)
        }
        onSuccess={async () => {
          await refreshData();
          setUnitAssignmentDialog({ open: false });
        }}
      />

      {/* Delete Unit Assignment Dialog */}
      <DeleteConfirmDialog
        open={deleteUnitAssignmentDialog.open}
        onOpenChange={(open) => setDeleteUnitAssignmentDialog({ open, unitId: 0 })}
        onConfirm={handleDeleteUnitAssignment}
        title="Hapus Unit Assignment"
        description="Apakah Anda yakin ingin menghapus unit assignment ini?"
        itemName="Unit Assignment"
      />

      {/* Document Dialog */}
      <Dialog open={documentDialog.open} onOpenChange={(open) => {
        setDocumentDialog({ open });
        if (!open) setDocumentDialog({ open: false });
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {documentDialog.document ? 'Edit Dokumen' : 'Tambah Dokumen Baru'}
            </DialogTitle>
            <DialogDescription>
              {documentDialog.document ? 'Edit informasi dokumen' : 'Tambahkan dokumen baru ke project'}
            </DialogDescription>
          </DialogHeader>
          <DocumentForm
            document={documentDialog.document || undefined}
            projectMembers={project.members}
            selectedProjectId={id}
            onSubmit={async (data) => {
              if (documentDialog.document) {
                await handleUpdateDocument(documentDialog.document.id, data);
              } else {
                await handleCreateDocument(data);
              }
              setDocumentDialog({ open: false });
            }}
            onCancel={() => setDocumentDialog({ open: false })}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Document Dialog */}
      <DeleteConfirmDialog
        open={deleteDocumentDialog.open}
        onOpenChange={(open) => setDeleteDocumentDialog({ open, documentId: '' })}
        onConfirm={handleDeleteDocument}
        title="Hapus Dokumen"
        description="Apakah Anda yakin ingin menghapus dokumen ini?"
        itemName="Dokumen"
      />

      {/* Document Detail Dialog */}
      {documentDetailDialog.document && (
        <DocumentDetailDialog
          open={documentDetailDialog.open}
          onOpenChange={(open) => setDocumentDetailDialog({ open, document: open ? documentDetailDialog.document : undefined })}
          document={documentDetailDialog.document}
          members={project.members}
          onDocumentUpdate={refreshData}
        />
      )}
    </div>
  );
}

