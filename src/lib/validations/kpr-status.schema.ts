import { z } from 'zod';

// KPR Status enum
export const kprStatusSchema = z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']);

// Create/Update KPR Status Schema
export const updateKprStatusSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  status: kprStatusSchema,
  bankName: z.string().optional(),
  submittedDate: z.string().datetime('Format tanggal tidak valid').optional(),
  approvedDate: z.string().datetime('Format tanggal tidak valid').optional(),
  rejectedDate: z.string().datetime('Format tanggal tidak valid').optional(),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateKprStatusInput = z.infer<typeof updateKprStatusSchema>;

