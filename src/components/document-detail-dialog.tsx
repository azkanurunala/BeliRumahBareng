'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, FileText, CheckCircle2, Clock, User, Calendar } from 'lucide-react';
import type { ProjectDocument, User } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

type DocumentDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ProjectDocument;
  members: User[];
};

export default function DocumentDetailDialog({
  open,
  onOpenChange,
  document,
  members,
}: DocumentDetailDialogProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMemberName = (userId: string) => {
    return members.find(m => m.id === userId)?.name || userId;
  };

  const getMemberAvatar = (userId: string) => {
    const member = members.find(m => m.id === userId);
    return member?.avatarUrl;
  };

  const getStatusBadge = () => {
    switch (document.status) {
      case 'Terverifikasi':
        return <Badge className="bg-green-600">Terverifikasi</Badge>;
      case 'Tertanda':
        return <Badge variant="default">Tertanda</Badge>;
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  const handleDownload = () => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const handleSign = () => {
    // Placeholder for sign action
    console.log('Sign document:', document.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {document.name}
              </DialogTitle>
              <DialogDescription className="mt-2">{document.description}</DialogDescription>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Document Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-card">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </p>
              <p className="text-sm font-medium">{document.status}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ukuran File
              </p>
              <p className="text-sm font-medium">{formatFileSize(document.size)}</p>
            </div>
            {document.uploadDate && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Tanggal Upload
                </p>
                <p className="text-sm font-medium">{formatDate(document.uploadDate)}</p>
              </div>
            )}
            {document.verifiedAt && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Diverifikasi Pada
                </p>
                <p className="text-sm font-medium">{formatDate(document.verifiedAt)}</p>
              </div>
            )}
          </div>

          {/* Uploaded By */}
          {document.uploadedBy && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <User className="h-3 w-3" />
                Diupload Oleh
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getMemberAvatar(document.uploadedBy)} />
                  <AvatarFallback>
                    {getMemberName(document.uploadedBy).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{getMemberName(document.uploadedBy)}</span>
              </div>
            </div>
          )}

          {/* Signed By */}
          {document.signedBy && document.signedBy.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Ditandatangani Oleh
              </p>
              <div className="space-y-2">
                {document.signedBy.map((userId) => {
                  const member = members.find(m => m.id === userId);
                  if (!member) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1">{member.name}</span>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document Preview Placeholder */}
          {document.url && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Preview
              </p>
              <div className="border rounded-lg p-8 bg-muted/50 flex flex-col items-center justify-center min-h-[200px]">
                <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Preview dokumen akan ditampilkan di sini
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: PDF, Image, atau dokumen lainnya
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {document.url && (
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {document.status === 'Menunggu' && (
              <Button onClick={handleSign} className="flex-1">
                Tanda Tangan
              </Button>
            )}
            {document.status === 'Tertanda' && (
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Lihat Dokumen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

