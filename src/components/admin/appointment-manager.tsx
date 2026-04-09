'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { PurchaseTransaction, Appointment, AppointmentType, AppointmentStatus } from '@/lib/types';
import { CalendarIcon, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AppointmentSchedulingDialog from '@/components/appointment-scheduling-dialog';

type AppointmentManagerProps = {
  transaction: PurchaseTransaction;
  onUpdate?: () => void;
};

const TYPE_LABELS: Record<AppointmentType, string> = {
  interview: 'Wawancara',
  notaris: 'Notaris',
  bank: 'Bank',
};

export default function AppointmentManager({
  transaction,
  onUpdate,
}: AppointmentManagerProps) {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>(transaction.appointments || []);
  const [isSchedulingDialogOpen, setIsSchedulingDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadAppointments();
  }, [transaction.id, filterType, filterStatus]);

  const loadAppointments = async () => {
    try {
      const params: Record<string, string> = { transactionId: transaction.id };
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;

      const response = await apiClient.get<Appointment[]>('/appointments', { params });

      if (response.success && response.data) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsSchedulingDialogOpen(true);
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      const response = await apiClient.patch('/appointments', {
        appointmentId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Appointment ditandai sebagai selesai',
        });
        loadAppointments();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      const response = await apiClient.patch('/appointments', {
        appointmentId,
        status: 'cancelled',
      });

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Appointment dibatalkan',
        });
        loadAppointments();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Selesai
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Dibatalkan
          </Badge>
        );
      case 'rescheduled':
        return (
          <Badge className="bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Dijadwalkan Ulang
          </Badge>
        );
      default:
        return (
          <Badge className="bg-primary">
            <Clock className="h-3 w-3 mr-1" />
            Terjadwal
          </Badge>
        );
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterType && apt.type !== filterType) return false;
    if (filterStatus && apt.status !== filterStatus) return false;
    if (selectedDate) {
      const aptDate = new Date(apt.scheduledDate);
      if (
        aptDate.getDate() !== selectedDate.getDate() ||
        aptDate.getMonth() !== selectedDate.getMonth() ||
        aptDate.getFullYear() !== selectedDate.getFullYear()
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment Manager</CardTitle>
              <CardDescription>
                Kelola jadwal appointments (scheduling tracker)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAppointment(null);
                setIsSchedulingDialogOpen(true);
              }}
            >
              Buat Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Tipe</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua tipe</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua status</SelectItem>
                  <SelectItem value="scheduled">Terjadwal</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  <SelectItem value="rescheduled">Dijadwalkan Ulang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'PPP', { locale: id })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada appointment</p>
              </div>
            ) : (
              filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{TYPE_LABELS[appointment.type]}</h4>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(appointment.scheduledDate), 'PPP p', { locale: id })}
                        </div>
                        {appointment.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {appointment.location}
                          </div>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      )}
                      {appointment.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Selesai: {format(new Date(appointment.completedAt), 'PPP p', { locale: id })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReschedule(appointment)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(appointment.id)}
                          >
                            Selesai
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            Batal
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Dialog */}
      <AppointmentSchedulingDialog
        open={isSchedulingDialogOpen}
        onOpenChange={setIsSchedulingDialogOpen}
        transaction={transaction}
        onSuccess={() => {
          loadAppointments();
          onUpdate?.();
        }}
      />
    </>
  );
}

