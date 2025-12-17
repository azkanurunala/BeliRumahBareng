'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
}

interface ChecklistCompleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ProjectMember[];
  itemId: string;
  progressDetailId: string;
  completedMembers: string[]; // Array of userIds who already completed this item
  onSuccess: () => void;
}

export function ChecklistCompleteMemberDialog({
  open,
  onOpenChange,
  members,
  itemId,
  progressDetailId,
  completedMembers,
  onSuccess,
}: ChecklistCompleteMemberDialogProps) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selected user when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedUserId('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Silakan pilih anggota terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(
        `/progress-details/${progressDetailId}/checklist/${itemId}/complete`,
        { completedBy: selectedUserId }
      );

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Checklist item berhasil ditandai sebagai selesai',
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: 'Gagal',
          description: response.error?.message || 'Gagal menandai checklist item',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error completing checklist item:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Terjadi kesalahan saat menandai checklist item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pilih Anggota yang Menyelesaikan</DialogTitle>
          <DialogDescription>
            Pilih anggota yang akan ditandai sebagai telah menyelesaikan checklist item ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto py-4">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tidak ada anggota yang tersedia
            </p>
          ) : (
            members.map((member) => {
              const isCompleted = completedMembers.includes(member.userId);
              const isSelected = selectedUserId === member.userId;

              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => !isCompleted && setSelectedUserId(member.userId)}
                  disabled={isCompleted}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                    isCompleted
                      ? 'bg-muted/50 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent cursor-pointer'
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl || undefined} alt={member.name} />
                    <AvatarFallback>
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.name}</p>
                    {member.email && (
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-xs text-muted-foreground">Sudah selesai</span>
                      </>
                    ) : isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedUserId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Tandai Selesai'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

