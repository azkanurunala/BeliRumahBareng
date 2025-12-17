'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProjectDocument, User, Project } from '@/lib/types';
import { Upload, X, Loader2, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const createDocumentSchema = z.object({
  name: z.string().min(1, 'Nama dokumen wajib diisi'),
  status: z.enum(['Menunggu', 'Tertanda', 'Terverifikasi'], {
    required_error: 'Status wajib dipilih',
  }),
  url: z.string().min(1, 'Dokumen wajib diupload').optional().or(z.literal('')),
  description: z.string().optional(),
  verifiedAt: z.string().optional(),
  projectId: z.string().min(1, 'Project wajib dipilih'), // Required when creating
  // uploadedBy dan signedBy dihapus - akan diisi otomatis
});

const editDocumentSchema = z.object({
  name: z.string().min(1, 'Nama dokumen wajib diisi'),
  status: z.enum(['Menunggu', 'Tertanda', 'Terverifikasi'], {
    required_error: 'Status wajib dipilih',
  }),
  url: z.string().min(1, 'Dokumen wajib diupload').optional().or(z.literal('')),
  description: z.string().optional(),
  verifiedAt: z.string().optional(),
  projectId: z.string().optional(), // Not needed when editing
  // uploadedBy dan signedBy dihapus - akan diisi otomatis
});

type CreateDocumentFormValues = z.infer<typeof createDocumentSchema>;
type EditDocumentFormValues = z.infer<typeof editDocumentSchema>;
type DocumentFormValues = CreateDocumentFormValues | EditDocumentFormValues;

interface DocumentFormProps {
  document?: ProjectDocument;
  projectMembers: User[];
  projects?: Project[]; // Optional: for project selection
  selectedProjectId?: string; // Optional: pre-selected project
  onSubmit: (data: DocumentFormValues) => void;
  onCancel?: () => void;
}

export function DocumentForm({ document, projectMembers, projects, selectedProjectId, onSubmit, onCancel }: DocumentFormProps) {
  const { toast } = useToast();
  const isEditing = !!document;
  const schema = isEditing ? editDocumentSchema : createDocumentSchema;
  
  const [uploadedDocument, setUploadedDocument] = useState<{ url: string; hint: string } | null>(
    document?.url ? {
      url: document.url,
      hint: document.name,
    } : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: document
      ? {
          name: document.name,
          status: document.status,
          url: document.url || '',
          description: document.description || '',
          verifiedAt: document.verifiedAt || '',
          projectId: undefined, // Not needed when editing existing doc
        }
      : {
          name: '',
          status: 'Menunggu',
          url: '',
          description: '',
          verifiedAt: '',
          projectId: selectedProjectId || '',
        },
  });

  // Update form when uploadedDocument changes
  useEffect(() => {
    if (uploadedDocument) {
      form.setValue('url', uploadedDocument.url);
    }
  }, [uploadedDocument, form]);

  const watchStatus = form.watch('status');
  const watchProjectId = form.watch('projectId');
  
  // Get members from selected project if projects are provided
  const availableMembers = projects && watchProjectId
    ? projects.find(p => p.id === watchProjectId)?.members || projectMembers
    : projectMembers;

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadedDocument(result.data);
        toast({
          title: 'Berhasil',
          description: 'Dokumen berhasil diupload',
        });
      } else {
        throw new Error(result.error?.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mengupload dokumen',
      });
    } finally {
      setIsUploading(false);
      if (documentFileInputRef.current) {
        documentFileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveDocument = () => {
    setUploadedDocument(null);
    form.setValue('url', '');
  };

  const handleSubmit = (data: DocumentFormValues) => {
    // Validate document
    if (!uploadedDocument && !isEditing) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Dokumen wajib diupload',
      });
      return;
    }

    // Use uploaded document
    if (uploadedDocument) {
      data.url = uploadedDocument.url;
    }

    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {projects && !isEditing && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Dokumen</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                  <SelectItem value="Tertanda">Tertanda</SelectItem>
                  <SelectItem value="Terverifikasi">Terverifikasi</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Dokumen</FormLabel>
          {uploadedDocument ? (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{uploadedDocument.hint}</p>
                <Link 
                  href={uploadedDocument.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  Lihat dokumen <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveDocument}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={documentFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => documentFileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Dokumen
                  </>
                )}
              </Button>
              <FormDescription className="mt-2">
                Upload dokumen (JPEG, PNG, WebP, PDF, DOC, DOCX). Maksimal 10MB.
              </FormDescription>
            </div>
          )}
          <FormField
            control={form.control}
            name="url"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi (Opsional)</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        {watchStatus === 'Terverifikasi' && (
          <FormField
            control={form.control}
            name="verifiedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Verifikasi</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value).toISOString() : '';
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Wajib diisi jika status adalah Terverifikasi
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit">Simpan</Button>
        </div>
      </form>
    </Form>
  );
}

