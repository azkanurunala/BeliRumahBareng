import { z } from 'zod';

// Property Interest Create Schema
export const createPropertyInterestSchema = z.object({
  propertyId: z.string().cuid('ID properti tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  unitId: z.number().int().positive('Unit ID harus positif').optional(),
  unitSize: z.number().positive('Ukuran unit harus positif').optional(),
  isFirstHome: z.boolean().default(false),
  willOccupy: z.boolean().default(false),
  email: z.string().email('Email tidak valid').optional(),
  phoneNumber: z.string().min(10, 'Nomor telepon minimal 10 karakter').optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
});

// Property Interest Update Schema
export const updatePropertyInterestSchema = createPropertyInterestSchema.partial().extend({
  id: z.string().cuid('ID interest tidak valid'),
});

// Property Interest Review Schema (for admin)
export const reviewPropertyInterestSchema = z.object({
  id: z.string().cuid('ID interest tidak valid'),
  status: z.enum(['approved', 'rejected'], {
    required_error: 'Status wajib dipilih',
  }),
  notes: z.string().optional(),
  reviewedBy: z.string().cuid('ID reviewer tidak valid'),
});

export type CreatePropertyInterestInput = z.infer<typeof createPropertyInterestSchema>;
export type UpdatePropertyInterestInput = z.infer<typeof updatePropertyInterestSchema>;
export type ReviewPropertyInterestInput = z.infer<typeof reviewPropertyInterestSchema>;

