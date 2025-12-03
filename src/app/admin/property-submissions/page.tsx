'use client';

import { useAdminData } from '@/contexts/admin-data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable, Column, CustomAction } from '@/components/admin/data-table';
import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, DollarSign, User, Mail, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SubmissionDetailModal } from '@/components/admin/submission-detail-modal';
import { ApprovalConfirmDialog } from '@/components/admin/approval-confirm-dialog';
import type { PropertySubmission } from '@/lib/types';

// Extended submission type with computed fields for easier searching
interface SubmissionWithDetails extends PropertySubmission {
  submitterName: string;
  typeLabel: string;
  formattedPrice: string;
  unitDisplay: string;
}

export default function AdminPropertySubmissionsPage() {
  const { propertySubmissions, users, createProperty, updatePropertySubmission } = useAdminData();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    type: [],
  });
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    submissionId: string | null;
  }>({
    open: false,
    type: 'approve',
    submissionId: null,
  });

  // Transform submissions to include computed fields
  const submissionsWithDetails = useMemo<SubmissionWithDetails[]>(() => {
    return propertySubmissions.map((submission) => {
      const submitter = users.find((u) => u.id === submission.submittedBy);
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(submission.askingPrice);

      let unitDisplay = '-';
      if (submission.totalUnits) {
        unitDisplay = `${submission.totalUnits} unit`;
      } else if (submission.totalArea) {
        unitDisplay = `${submission.totalArea} ${submission.unitMeasure || 'm²'}`;
      }

      return {
        ...submission,
        submitterName: submitter?.name || '-',
        typeLabel: submission.type === 'co-building' ? 'Bangunan' : 'Lahan',
        formattedPrice,
        unitDisplay,
      };
    });
  }, [propertySubmissions, users]);

  // Apply filters
  const filteredSubmissions = useMemo(() => {
    let result = submissionsWithDetails;

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter((s) => filters.status.includes(s.status));
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      result = result.filter((s) => filters.type.includes(s.type));
    }

    // Location filter (text search)
    if (locationFilter) {
      const locationLower = locationFilter.toLowerCase();
      result = result.filter((s) => s.location.toLowerCase().includes(locationLower));
    }

    // Price range filter
    if (priceMin) {
      const min = parseFloat(priceMin.replace(/[^\d]/g, ''));
      if (!isNaN(min)) {
        result = result.filter((s) => s.askingPrice >= min);
      }
    }
    if (priceMax) {
      const max = parseFloat(priceMax.replace(/[^\d]/g, ''));
      if (!isNaN(max)) {
        result = result.filter((s) => s.askingPrice <= max);
      }
    }

    return result;
  }, [submissionsWithDetails, filters, locationFilter, priceMin, priceMax]);

  const handleApproveClick = (submissionId: string) => {
    setApprovalDialog({
      open: true,
      type: 'approve',
      submissionId,
    });
  };

  const handleRejectClick = (submissionId: string) => {
    setApprovalDialog({
      open: true,
      type: 'reject',
      submissionId,
    });
  };

  const handleApproveConfirm = async (notes?: string) => {
    if (!approvalDialog.submissionId) return;

    const submission = propertySubmissions.find((s) => s.id === approvalDialog.submissionId);
    if (!submission) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Property submission tidak ditemukan',
      });
      return;
    }

    // Validate images
    if (!submission.images || submission.images.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Property submission harus memiliki minimal 1 gambar untuk bisa disetujui',
      });
      return;
    }

    try {
      // Create property from submission
      const newProperty = {
        id: `prop-${Date.now()}`,
        name: submission.name,
        description: submission.description,
        price: submission.askingPrice,
        totalArea: submission.totalArea,
        location: submission.location,
        images: submission.images,
        type: submission.type,
        totalUnits: submission.totalUnits,
        unitSize: submission.unitSize,
        unitMeasure: submission.unitMeasure || 'm²',
        unitName: (submission.type === 'co-building'
          ? 'Lantai'
          : submission.totalUnits
          ? 'Kavling'
          : 'Kepemilikan') as const,
        planningInfo: {
          sitePlanUrl: '',
          sitePlanHint: '',
          developmentPlan: '',
          environmentalAnalysis: '',
        },
      };

      // Create property (async)
      await createProperty(newProperty);

      // Update submission status (async)
      await updatePropertySubmission(approvalDialog.submissionId, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        notes: notes,
      });

      toast({
        title: 'Berhasil',
        description: 'Property submission telah disetujui dan properti baru telah dibuat.',
      });

      setApprovalDialog({ open: false, type: 'approve', submissionId: null });
    } catch (error) {
      console.error('Error approving property submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menyetujui property submission',
      });
    }
  };

  const handleRejectConfirm = (notes?: string) => {
    if (!approvalDialog.submissionId) return;

    updatePropertySubmission(approvalDialog.submissionId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      notes: notes,
    });

    toast({
      title: 'Berhasil',
      description: 'Property submission telah ditolak.',
    });

    setApprovalDialog({ open: false, type: 'reject', submissionId: null });
  };

  const handleViewDetail = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  const columns: Column<SubmissionWithDetails>[] = [
    {
      key: 'property',
      header: 'Properti',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.name}</div>
          <div className="text-sm text-muted-foreground">{row.location}</div>
          <div className="flex items-center gap-2">
            <Badge variant={row.type === 'co-building' ? 'default' : 'secondary'} className="text-xs">
              {row.typeLabel}
            </Badge>
            {row.unitDisplay !== '-' && (
              <Badge variant="outline" className="text-xs">
                {row.unitDisplay}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.contactPerson}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.contactEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.contactPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Diajukan',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.submitterName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{new Date(row.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'statusPrice',
      header: 'Status/Harga',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <div>
            <Badge
              variant={
                row.status === 'approved'
                  ? 'default'
                  : row.status === 'rejected'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs"
            >
              {row.status === 'approved'
                ? 'Disetujui'
                : row.status === 'rejected'
                ? 'Ditolak'
                : 'Menunggu'}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.formattedPrice}</span>
          </div>
        </div>
      ),
    },
  ];

  const actionButtons: CustomAction<SubmissionWithDetails>[] = [
    {
      label: 'Lihat Detail',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => handleViewDetail(row),
      variant: 'ghost',
      size: 'icon',
    },
    {
      label: 'Setujui & Buat Properti',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (row) => handleApproveClick(row.id),
      variant: 'default',
      size: 'sm',
      show: (row) => row.status === 'pending',
    },
    {
      label: 'Tolak',
      icon: <XCircle className="h-4 w-4" />,
      onClick: (row) => handleRejectClick(row.id),
      variant: 'outline',
      size: 'sm',
      show: (row) => row.status === 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Property Submissions</h1>
        <p className="text-muted-foreground">
          Review dan kelola pengajuan properti dari pengguna
        </p>
      </div>

      <Card>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipe</label>
              <Select
                value={filters.type?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    type: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="co-building">Co-Building</SelectItem>
                  <SelectItem value="co-owning">Co-Owning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lokasi</label>
              <Input
                placeholder="Cari lokasi..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Harga Min</label>
              <Input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Harga Max</label>
              <Input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            data={filteredSubmissions}
            columns={columns}
            searchKeys={['name', 'location', 'contactPerson', 'contactEmail', 'submitterName']}
            searchPlaceholder="Cari properti, lokasi, contact person, atau email..."
            actionButtons={actionButtons}
            filters={filters}
            onFiltersChange={setFilters}
            defaultPageSize={25}
          />
        </CardContent>
      </Card>

      {selectedSubmission && (
        <SubmissionDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          submission={selectedSubmission}
          submitter={users.find((u) => u.id === selectedSubmission.submittedBy) || null}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
        />
      )}

      <ApprovalConfirmDialog
        open={approvalDialog.open}
        onOpenChange={(open) =>
          setApprovalDialog({ ...approvalDialog, open })
        }
        type={approvalDialog.type}
        title={
          approvalDialog.type === 'approve'
            ? 'Setujui Property Submission?'
            : 'Tolak Property Submission?'
        }
        description={
          approvalDialog.type === 'approve'
            ? 'Apakah Anda yakin ingin menyetujui submission ini? Properti baru akan dibuat setelah approval.'
            : 'Apakah Anda yakin ingin menolak submission ini? Notes rejection wajib diisi.'
        }
        onConfirm={
          approvalDialog.type === 'approve'
            ? handleApproveConfirm
            : handleRejectConfirm
        }
        requireNotes={approvalDialog.type === 'reject'}
      />
    </div>
  );
}
