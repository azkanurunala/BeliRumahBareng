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
import { DataTable, Column, CustomAction } from '@/components/admin/data-table';
import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Eye, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InterestDetailModal } from '@/components/admin/interest-detail-modal';
import { ApprovalConfirmDialog } from '@/components/admin/approval-confirm-dialog';
import type { PropertyInterest } from '@/lib/types';

// Extended interest type with computed fields for easier searching
interface InterestWithDetails extends PropertyInterest {
  userName: string;
  userEmail: string;
  userPhone: string;
  propertyName: string;
  propertyLocation: string;
  isFlexible: boolean;
  unitDisplay: string;
}

export default function AdminInterestsPage() {
  const { interests, properties, users, updateInterest } = useAdminData();
  const { toast } = useToast();
  const [filters, setFilters] = useState<Record<string, string[]>>({
    propertyId: [],
    status: [],
    isFirstHome: [],
    willOccupy: [],
  });
  const [selectedInterest, setSelectedInterest] = useState<InterestWithDetails | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject';
    interestId: string | null;
  }>({
    open: false,
    type: 'approve',
    interestId: null,
  });

  // Transform interests to include computed fields
  const interestsWithDetails = useMemo<InterestWithDetails[]>(() => {
    return interests.map((interest) => {
      const user = users.find((u) => u.id === interest.userId);
      const property = properties.find((p) => p.id === interest.propertyId);
      const isFlexible = property ? !property.totalUnits && !!property.totalArea : false;

      let unitDisplay = '-';
      if (!isFlexible && interest.unitId && property) {
        unitDisplay = `${property.unitName} ${interest.unitId}`;
      } else if (isFlexible && interest.unitSize) {
        unitDisplay = `${interest.unitSize} m²`;
      }

      return {
        ...interest,
        userName: user?.name || '-',
        userEmail: interest.email || user?.email || '-',
        userPhone: interest.phoneNumber || user?.phoneNumber || '-',
        propertyName: property?.name || '-',
        propertyLocation: property?.location || '-',
        isFlexible,
        unitDisplay,
      };
    });
  }, [interests, users, properties]);

  // Apply filters
  const filteredInterests = useMemo(() => {
    let result = interestsWithDetails;

    // Property filter
    if (filters.propertyId && filters.propertyId.length > 0) {
      result = result.filter((i) => filters.propertyId.includes(i.propertyId));
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      result = result.filter((i) => filters.status.includes(i.status || 'pending'));
    }

    // IsFirstHome filter
    if (filters.isFirstHome && filters.isFirstHome.length > 0) {
      const filterValues = filters.isFirstHome.map((v) => v === 'true');
      result = result.filter((i) => filterValues.includes(i.isFirstHome));
    }

    // WillOccupy filter
    if (filters.willOccupy && filters.willOccupy.length > 0) {
      const filterValues = filters.willOccupy.map((v) => v === 'true');
      result = result.filter((i) => filterValues.includes(i.willOccupy));
    }

    return result;
  }, [interestsWithDetails, filters]);

  const handleUpdateStatus = (interestId: string, status: 'approved' | 'rejected' | 'pending', notes?: string) => {
    updateInterest(interestId, { 
      status, 
      notes,
      reviewedAt: new Date().toISOString(),
    });
    toast({
      title: 'Berhasil',
      description: `Status interest telah diubah menjadi ${status === 'approved' ? 'Disetujui' : status === 'rejected' ? 'Ditolak' : 'Menunggu'}`,
    });
  };

  const handleViewDetail = (interest: InterestWithDetails) => {
    setSelectedInterest(interest);
    setModalOpen(true);
  };

  const handleApproveClick = (interestId: string) => {
    setApprovalDialog({
      open: true,
      type: 'approve',
      interestId,
    });
  };

  const handleRejectClick = (interestId: string) => {
    setApprovalDialog({
      open: true,
      type: 'reject',
      interestId,
    });
  };

  const handleApproveConfirm = (notes?: string) => {
    if (!approvalDialog.interestId) return;
    handleUpdateStatus(approvalDialog.interestId, 'approved', notes);
    setApprovalDialog({ open: false, type: 'approve', interestId: null });
  };

  const handleRejectConfirm = (notes?: string) => {
    if (!approvalDialog.interestId) return;
    handleUpdateStatus(approvalDialog.interestId, 'rejected', notes);
    setApprovalDialog({ open: false, type: 'reject', interestId: null });
  };

  const columns: Column<InterestWithDetails>[] = [
    {
      key: 'peminat',
      header: 'Peminat',
      sortable: false,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.userName}</div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.userEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{row.userPhone}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'propertyName',
      header: 'Properti',
      sortable: true,
      searchable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.propertyName}</div>
          <div className="text-xs text-muted-foreground">{row.propertyLocation}</div>
          {row.unitDisplay !== '-' && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {row.unitDisplay}
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'isFirstHome',
      header: 'Rumah Pertama',
      sortable: true,
      cell: (row) =>
        row.isFirstHome ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      key: 'willOccupy',
      header: 'Akan Ditempati',
      sortable: true,
      cell: (row) =>
        row.willOccupy ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge
          variant={
            row.status === 'approved'
              ? 'default'
              : row.status === 'rejected'
              ? 'destructive'
              : 'secondary'
          }
        >
          {row.status === 'approved'
            ? 'Disetujui'
            : row.status === 'rejected'
            ? 'Ditolak'
            : 'Menunggu'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tanggal',
      sortable: true,
      cell: (row) => new Date(row.createdAt).toLocaleDateString('id-ID'),
    },
  ];

  const actionButtons: CustomAction<InterestWithDetails>[] = [
    {
      label: 'Lihat Detail',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row) => handleViewDetail(row),
      variant: 'ghost',
      size: 'icon',
    },
    {
      label: 'Setujui',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: (row) => handleApproveClick(row.id),
      variant: 'outline',
      size: 'icon',
      show: (row) => row.status !== 'approved',
    },
    {
      label: 'Tolak',
      icon: <XCircle className="h-4 w-4" />,
      onClick: (row) => handleRejectClick(row.id),
      variant: 'outline',
      size: 'icon',
      show: (row) => row.status !== 'rejected',
    },
  ];

  const propertyOptions = properties.map((p) => p.id);
  const statusOptions = ['pending', 'approved', 'rejected'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Peminat Properti</h1>
        <p className="text-muted-foreground">
          Kelola pernyataan minat dari pengguna untuk setiap properti
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Properti</label>
              <Select
                value={filters.propertyId?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    propertyId: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Properti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Properti</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
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
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rumah Pertama</label>
              <Select
                value={filters.isFirstHome?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    isFirstHome: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Ya</SelectItem>
                  <SelectItem value="false">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Akan Ditempati</label>
              <Select
                value={filters.willOccupy?.[0] || 'all'}
                onValueChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    willOccupy: value === 'all' ? [] : [value],
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="true">Ya</SelectItem>
                  <SelectItem value="false">Tidak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Peminat</CardTitle>
          <CardDescription>
            Semua pernyataan minat dari pengguna untuk properti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredInterests}
            columns={columns}
            searchKeys={['userName', 'userEmail', 'userPhone', 'propertyName']}
            searchPlaceholder="Cari nama, email, telepon, atau properti..."
            actionButtons={actionButtons}
            filters={filters}
            onFiltersChange={setFilters}
            defaultPageSize={25}
          />
        </CardContent>
      </Card>

      {selectedInterest && (
        <InterestDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          interest={selectedInterest}
          property={properties.find((p) => p.id === selectedInterest.propertyId) || null}
          user={users.find((u) => u.id === selectedInterest.userId) || null}
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
            ? 'Setujui Interest?'
            : 'Tolak Interest?'
        }
        description={
          approvalDialog.type === 'approve'
            ? 'Apakah Anda yakin ingin menyetujui interest ini?'
            : 'Apakah Anda yakin ingin menolak interest ini? Notes rejection wajib diisi.'
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
