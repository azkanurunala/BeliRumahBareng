'use client';

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
import { mockUsers } from '@/lib/mock-data';

const createDocumentSchema = z.object({
  name: z.string().min(1, 'Nama dokumen wajib diisi'),
  status: z.enum(['Menunggu', 'Tertanda', 'Terverifikasi'], {
    required_error: 'Status wajib dipilih',
  }),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  uploadedBy: z.string().optional(),
  signedBy: z.array(z.string()).optional(),
  verifiedAt: z.string().optional(),
  projectId: z.string().min(1, 'Project wajib dipilih'), // Required when creating
});

const editDocumentSchema = z.object({
  name: z.string().min(1, 'Nama dokumen wajib diisi'),
  status: z.enum(['Menunggu', 'Tertanda', 'Terverifikasi'], {
    required_error: 'Status wajib dipilih',
  }),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  uploadedBy: z.string().optional(),
  signedBy: z.array(z.string()).optional(),
  verifiedAt: z.string().optional(),
  projectId: z.string().optional(), // Not needed when editing
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
  const isEditing = !!document;
  const schema = isEditing ? editDocumentSchema : createDocumentSchema;
  
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: document
      ? {
          name: document.name,
          status: document.status,
          url: document.url || '',
          description: document.description || '',
          uploadedBy: document.uploadedBy || '',
          signedBy: document.signedBy || [],
          verifiedAt: document.verifiedAt || '',
          projectId: undefined, // Not needed when editing existing doc
        }
      : {
          name: '',
          status: 'Menunggu',
          url: '',
          description: '',
          uploadedBy: '',
          signedBy: [],
          verifiedAt: '',
          projectId: selectedProjectId || '',
        },
  });

  const watchStatus = form.watch('status');
  const watchSignedBy = form.watch('signedBy') || [];
  const watchProjectId = form.watch('projectId');
  
  // Get members from selected project if projects are provided
  const availableMembers = projects && watchProjectId
    ? projects.find(p => p.id === watchProjectId)?.members || projectMembers
    : projectMembers;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Dokumen (Opsional)</FormLabel>
              <FormControl>
                <Input {...field} type="url" value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="uploadedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diupload Oleh (Opsional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {availableMembers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Ditandatangani Oleh (Opsional)</FormLabel>
          <div className="space-y-2">
            {availableMembers.map((user) => (
              <FormField
                key={user.id}
                control={form.control}
                name="signedBy"
                render={({ field }) => {
                  return (
                    <FormItem
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(user.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...watchSignedBy, user.id])
                              : field.onChange(
                                  watchSignedBy.filter(
                                    (value) => value !== user.id
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {user.name}
                      </FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
          </div>
        </div>

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

