import { z } from 'zod';

// Project Create Schema
export const createProjectSchema = z.object({
  propertyId: z.string().cuid('ID properti tidak valid'),
  propertyName: z.string().min(1, 'Nama properti wajib diisi'),
  propertyImageUrl: z.string().url('URL gambar tidak valid').or(z.literal('')),
  propertyImageHint: z.string().min(1, 'Image hint wajib diisi'),
  status: z.enum(['active', 'closed', 'completed']).optional(),
  kycProgress: z.number().int().min(0).max(100).default(0),
  fundingProgress: z.number().int().min(0).max(100).default(0),
  legalProgress: z.number().int().min(0).max(100).default(0),
  closingProgress: z.number().int().min(0).max(100).default(0),
});

// Project Update Schema
export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().cuid('ID project tidak valid'),
});

// Project Member Schema
export const projectMemberSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  role: z.string().optional(),
});

// Unit Assignment Schema
export const unitAssignmentSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  unitId: z.number().int().positive('Unit ID harus positif'),
  userId: z.string().cuid('ID user tidak valid'),
  price: z.number().positive('Harga harus positif'),
  size: z.number().positive('Ukuran harus positif').optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>;
export type UnitAssignmentInput = z.infer<typeof unitAssignmentSchema>;

