'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import type { ActivityLog, ActivityLogAction } from '@/lib/types';
import { Clock, User, FileText, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type ActivityLogViewerProps = {
  transactionId: string;
  showFilters?: boolean;
};

const ACTION_LABELS: Record<ActivityLogAction, string> = {
  state_transition: 'Perubahan Status',
  payment: 'Pembayaran',
  appointment_scheduled: 'Appointment Dijadwalkan',
  appointment_completed: 'Appointment Selesai',
  appointment_cancelled: 'Appointment Dibatalkan',
  interview_recorded: 'Wawancara Dicatat',
  kpr_status_updated: 'Status KPR Diupdate',
  construction_checkpoint_updated: 'Checkpoint Pembangunan Diupdate',
  unit_locked: 'Unit Dikunci',
  unit_unlocked: 'Unit Dibuka',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  sales: 'Sales',
  customer: 'Customer',
};

export default function ActivityLogViewer({
  transactionId,
  showFilters = true,
}: ActivityLogViewerProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterActor, setFilterActor] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, [transactionId, filterAction, filterActor]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { transactionId };
      if (filterAction) params.action = filterAction;
      if (filterActor) params.actorId = filterActor;

      const response = await apiClient.get<ActivityLog[]>('/activity-logs', { params });

      if (response.success && response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: ActivityLogAction) => {
    const colors: Record<string, string> = {
      state_transition: 'bg-blue-600',
      payment: 'bg-green-600',
      appointment_scheduled: 'bg-purple-600',
      appointment_completed: 'bg-indigo-600',
      appointment_cancelled: 'bg-red-600',
      interview_recorded: 'bg-orange-600',
      kpr_status_updated: 'bg-yellow-600',
      construction_checkpoint_updated: 'bg-teal-600',
      unit_locked: 'bg-gray-600',
      unit_unlocked: 'bg-gray-500',
    };

    return (
      <Badge className={colors[action] || 'bg-gray-600'}>
        {ACTION_LABELS[action] || action}
      </Badge>
    );
  };

  const parseDetails = (details?: string) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Audit trail transaksi (read-only, immutable)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="filterAction">Filter Aksi</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger id="filterAction">
                  <SelectValue placeholder="Semua aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua aksi</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterActor">Filter Aktor</Label>
              <Input
                id="filterActor"
                placeholder="ID aktor..."
                value={filterActor}
                onChange={(e) => setFilterActor(e.target.value)}
              />
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada activity log</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const details = parseDetails(log.details);

                return (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <Badge variant="outline">{ROLE_LABELS[log.actorRole] || log.actorRole}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.createdAt), 'PPp', { locale: id })}
                      </div>
                    </div>

                    {log.fromState && log.toState && (
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{log.fromState}</Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline">{log.toState}</Badge>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mb-1">
                      Aktor: {log.actorId}
                    </div>

                    {details && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

