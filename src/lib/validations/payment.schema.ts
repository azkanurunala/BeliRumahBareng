import { z } from 'zod';

// Payment Plan Base Schema (tanpa refine untuk bisa dipanggil .partial())
const paymentPlanBaseSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  unitId: z.number().int().positive('Unit ID harus positif'),
  type: z.enum(['installment', 'cash_keras', 'cash_bertahap'], {
    required_error: 'Tipe payment plan wajib dipilih',
  }),
  totalAmount: z.number().positive('Total amount harus positif'),
  downPayment: z.number().positive('Down payment harus positif').optional(),
  installmentAmount: z.number().positive('Installment amount harus positif').optional(),
  totalInstallments: z.number().int().positive('Total installments harus positif').optional(),
  startDate: z.string().datetime('Format tanggal tidak valid').optional(),
  endDate: z.string().datetime('Format tanggal tidak valid').optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

// Payment Plan Create Schema (dengan refine)
export const createPaymentPlanSchema = paymentPlanBaseSchema.refine((data) => {
  // Jika type adalah installment, installmentAmount dan totalInstallments wajib
  if (data.type === 'installment') {
    return data.installmentAmount !== undefined && data.totalInstallments !== undefined;
  }
  return true;
}, {
  message: 'Untuk installment, installmentAmount dan totalInstallments wajib diisi',
  path: ['installmentAmount'],
});

// Payment Plan Update Schema (menggunakan base schema yang sudah di-partial)
export const updatePaymentPlanSchema = paymentPlanBaseSchema.partial().extend({
  id: z.string().cuid('ID payment plan tidak valid'),
});

// Payment Base Schema (tanpa refine untuk bisa dipanggil .partial())
const paymentBaseSchema = z.object({
  paymentPlanId: z.string().cuid('ID payment plan tidak valid').optional(),
  projectId: z.string().cuid('ID project tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  unitId: z.number().int().positive('Unit ID harus positif'),
  amount: z.number().positive('Amount harus positif'),
  paymentDate: z.string().datetime('Format tanggal tidak valid').optional(),
  dueDate: z.string().datetime('Format tanggal tidak valid').optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM').nullable().optional(),
  status: z.enum(['paid', 'pending', 'overdue', 'partial'], {
    required_error: 'Status wajib dipilih',
  }),
  paymentMethod: z.enum(['transfer', 'cash', 'other']).optional(),
  receiptUrl: z.string().url('URL tidak valid').optional().or(z.literal('')),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

// Payment Create Schema (dengan refine)
export const createPaymentSchema = paymentBaseSchema.refine((data) => {
  // Jika payment method adalah transfer, require either receiptUrl or paymentReference
  if (data.paymentMethod === 'transfer') {
    return !!(data.receiptUrl?.trim() || data.paymentReference?.trim());
  }
  return true;
}, {
  message: 'Untuk transfer, wajib upload bukti pembayaran atau isi nomor referensi pembayaran',
  path: ['paymentReference'],
});

// Payment Update Schema (menggunakan base schema yang sudah di-partial)
export const updatePaymentSchema = paymentBaseSchema.partial().extend({
  id: z.string().cuid('ID payment tidak valid'),
});

// Payment Verification Schema
export const verifyPaymentSchema = z.object({
  paymentId: z.string().cuid('ID payment tidak valid'),
  verifiedBy: z.string().cuid('ID verifier tidak valid'),
  notes: z.string().optional(),
});

export type CreatePaymentPlanInput = z.infer<typeof createPaymentPlanSchema>;
export type UpdatePaymentPlanInput = z.infer<typeof updatePaymentPlanSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

