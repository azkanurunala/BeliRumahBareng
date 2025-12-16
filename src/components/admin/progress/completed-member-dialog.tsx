'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CompletedMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressDetailId: string;
  members: User[];
  completedMemberIds: string[];
  onSuccess: () => void;
}

export function CompletedMemberDialog({
  open,
  onOpenChange,
  progressDetailId,
  members,
  completedMemberIds,
  onSuccess,
}: CompletedMemberDialogProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Filter out already completed members
  const availableMembers = members.filter(
    (member) => !completedMemberIds.includes(member.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation
    if (!selectedUserId) {
      setValidationError('Anggota wajib dipilih');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(
        `/progress-details/${progressDetailId}/completed-members`,
        {
          userId: selectedUserId,
        }
      );

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Anggota berhasil ditandai sebagai selesai',
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menandai anggota sebagai selesai',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding completed member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserId('');
      setValidationError('');
      onOpenChange(false);
    }
  };

  if (availableMembers.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tandai Anggota Selesai</DialogTitle>
            <DialogDescription>
              Semua anggota sudah ditandai sebagai selesai
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tandai Anggota Selesai</DialogTitle>
          <DialogDescription>
            Pilih anggota yang sudah menyelesaikan progress ini
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {validationError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {validationError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="member">
                Anggota <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota">
                    {selectedUserId && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const member = members.find((m) => m.id === selectedUserId);
                          return member ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback className="text-xs">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedUserId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tandai Selesai
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

