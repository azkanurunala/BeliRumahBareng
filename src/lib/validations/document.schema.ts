import { z } from 'zod';

// Project Document Create Schema
export const createProjectDocumentSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  name: z.string().min(1, 'Nama dokumen wajib diisi'),
  status: z.enum(['Menunggu', 'Tertanda', 'Terverifikasi'], {
    required_error: 'Status wajib dipilih',
  }),
  url: z.string().url('URL tidak valid').optional().or(z.literal('')),
  uploadDate: z.string().datetime('Format tanggal tidak valid').optional(),
  size: z.number().int().positive('Ukuran harus positif').optional(),
  description: z.string().optional(),
  uploadedBy: z.string().min(1, 'ID uploader tidak valid').optional(), // Optional, akan diisi otomatis dari current user
});

// Project Document Update Schema
export const updateProjectDocumentSchema = createProjectDocumentSchema.partial().extend({
  id: z.string().cuid('ID document tidak valid'),
  verifiedAt: z.string().datetime('Format tanggal tidak valid').optional(),
});

// Document Signature Create Schema
export const createDocumentSignatureSchema = z.object({
  documentId: z.string().cuid('ID document tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
});

// Document Signature Delete Schema
export const deleteDocumentSignatureSchema = z.object({
  documentId: z.string().cuid('ID document tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
});

export type CreateProjectDocumentInput = z.infer<typeof createProjectDocumentSchema>;
export type UpdateProjectDocumentInput = z.infer<typeof updateProjectDocumentSchema>;
export type CreateDocumentSignatureInput = z.infer<typeof createDocumentSignatureSchema>;
export type DeleteDocumentSignatureInput = z.infer<typeof deleteDocumentSignatureSchema>;








