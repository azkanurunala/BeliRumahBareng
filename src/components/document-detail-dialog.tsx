'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, FileText, CheckCircle2, Clock, User, Calendar } from 'lucide-react';
import type { ProjectDocument, User } from '@/lib/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '@/contexts/auth-context';
import { addDocumentSignature } from '@/lib/actions/document.actions';
import { useToast } from '@/hooks/use-toast';

type DocumentDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ProjectDocument;
  members: User[];
  onDocumentUpdate?: () => void;
};

export default function DocumentDetailDialog({
  open,
  onOpenChange,
  document,
  members,
  onDocumentUpdate,
}: DocumentDetailDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSigning, setIsSigning] = useState(false);

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

  const handleDownload = async () => {
    if (!document.url) return;
    
    // Get file extension from URL if document name doesn't have one
    let filename = document.name;
    if (!filename.includes('.')) {
      const urlExtension = document.url.split('.').pop()?.split('?')[0];
      if (urlExtension) {
        filename = `${document.name}.${urlExtension}`;
      }
    }
    
    // Try to fetch as blob first (works for same-origin or CORS-enabled URLs)
    try {
      const response = await fetch(document.url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        
        window.document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          window.document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        return;
      }
    } catch (error) {
      // If fetch fails (CORS issue or network error), fall through to direct download
      console.log('Fetch failed, using direct download:', error);
    }
    
    // Fallback: Direct download using anchor element
    // This works for most cases, even with CORS restrictions
    try {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      window.document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Error with direct download:', error);
      // Last resort: open in new tab
      window.open(document.url, '_blank');
    }
  };

  const handleSign = async () => {
    // Validate user is logged in
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Anda harus login untuk menandatangani dokumen',
      });
      return;
    }

    // Validate user hasn't already signed
    if (document.signedBy && document.signedBy.includes(user.id)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Anda sudah menandatangani dokumen ini',
      });
      return;
    }

    setIsSigning(true);
    try {
      // Call server action to add signature
      const result = await addDocumentSignature({
        documentId: document.id,
        userId: user.id,
      });

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil ditandatangani',
        });

        // Refresh document data via callback
        if (onDocumentUpdate) {
          await onDocumentUpdate();
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error?.message || 'Gagal menandatangani dokumen',
        });
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat menandatangani dokumen',
      });
    } finally {
      setIsSigning(false);
    }
  };

  // Determine if document is PDF for full-width modal
  const isPdf = document.url ? /\.pdf$/i.test(document.url) : false;
  const isImage = document.url ? /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.url) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isPdf ? "max-w-[95vw] w-[95vw] max-h-[80vh] h-[80vh] p-0" : "max-w-2xl max-h-[80vh] overflow-y-auto"}>
        {/* Always include DialogTitle for accessibility, hide it visually for PDF */}
        <DialogHeader>
          {isPdf ? (
            <DialogTitle asChild>
              <VisuallyHidden>{document.name}</VisuallyHidden>
            </DialogTitle>
          ) : (
            <>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {document.name}
              </DialogTitle>
              <DialogDescription className="mt-2">{document.description}</DialogDescription>
              <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex-1" />
                {getStatusBadge()}
              </div>
            </>
          )}
        </DialogHeader>

        <div className={isPdf ? "h-full flex flex-col" : "space-y-6 mt-4"}>
          {isPdf && (
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{document.name}</h3>
                  {document.description && (
                    <p className="text-sm text-muted-foreground">{document.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
          
          {/* Document Preview - PDF */}
          {isPdf && document.url && (
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${document.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-0"
                title={document.name}
                style={{ minHeight: 'calc(80vh - 120px)' }}
                onError={() => {
                  console.error('Error loading PDF:', document.url);
                }}
              />
            </div>
          )}

          {/* Actions for PDF */}
          {isPdf && (
            <div className="flex gap-3 p-4 border-t bg-background">
              {document.status === 'Menunggu' && (
                <Button onClick={handleSign} className="flex-1" disabled={isSigning}>
                  {isSigning ? 'Memproses...' : 'Tanda Tangan'}
                </Button>
              )}
              {document.status === 'Tertanda' && (
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Dokumen
                </Button>
              )}
            </div>
          )}

          {/* Non-PDF Content */}
          {!isPdf && (
            <>
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

              {/* Document Preview - Non-PDF */}
              {document.url && (() => {
                const url = document.url;
                const isImageLocal = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Preview
                    </p>
                    <div className="border rounded-lg overflow-hidden bg-muted/50">
                      {isImageLocal ? (
                        <div className="relative w-full min-h-[200px] max-h-[600px] flex items-center justify-center bg-muted">
                          <img
                            src={url}
                            alt={document.name}
                            className="max-w-full max-h-[600px] object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="p-8 flex flex-col items-center justify-center">
                                    <FileText class="h-12 w-12 text-muted-foreground mb-2" />
                                    <p class="text-sm text-muted-foreground text-center">Gagal memuat gambar</p>
                                    <p class="text-xs text-muted-foreground mt-1">URL: ${url}</p>
                                  </div>
                                `;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="border rounded-lg p-8 bg-muted/50 flex flex-col items-center justify-center min-h-[200px]">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            Preview tidak tersedia untuk format ini
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Format: {url.split('.').pop()?.toUpperCase() || 'Unknown'}
                          </p>
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="mt-4"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download untuk Melihat
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Actions for Non-PDF */}
              <div className="flex gap-3 pt-4 border-t">
                {document.url && (
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {document.status === 'Menunggu' && (
                  <Button onClick={handleSign} className="flex-1" disabled={isSigning}>
                    {isSigning ? 'Memproses...' : 'Tanda Tangan'}
                  </Button>
                )}
                {document.status === 'Tertanda' && (
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Lihat Dokumen
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

