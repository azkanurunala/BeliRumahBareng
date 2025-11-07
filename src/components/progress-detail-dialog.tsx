'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import type { ProgressDetail, User } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

type ProgressDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progressDetail: ProgressDetail;
  members: User[];
};

export default function ProgressDetailDialog({
  open,
  onOpenChange,
  progressDetail,
  members,
}: ProgressDetailDialogProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  const getMemberName = (userId: string) => {
    return members.find(m => m.id === userId)?.name || userId;
  };

  const getMemberAvatar = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.avatarUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            {progressDetail.title}
          </DialogTitle>
          <DialogDescription>{progressDetail.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Percentage */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-lg font-bold text-primary">{progressDetail.percentage}%</span>
            </div>
            <Progress value={progressDetail.percentage} className="h-3" />
          </div>

          {/* Checklist */}
          {progressDetail.checklist.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Checklist
              </h3>
              <div className="space-y-2">
                {progressDetail.checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox checked={item.completed} disabled className="mt-0.5" />
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
          {progressDetail.completedMembers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Anggota yang Sudah Menyelesaikan
              </h3>
              <div className="flex flex-wrap gap-2">
                {progressDetail.completedMembers.map((userId) => {
                  const member = members.find(m => m.id === userId);
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
          {progressDetail.milestones && progressDetail.milestones.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Timeline
              </h3>
              <div className="space-y-3">
                {progressDetail.milestones.map((milestone, index) => (
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
                      {index < progressDetail.milestones!.length - 1 && (
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
          {progressDetail.notes && (
            <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
              <h3 className="font-semibold text-sm">Catatan</h3>
              <p className="text-sm text-muted-foreground">{progressDetail.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

