import { z } from 'zod';

// Purchase Transaction State enum
export const purchaseTransactionStateSchema = z.enum([
  'DRAFT',
  'BOOKED',
  'INTERVIEWED',
  'CASH_PROCESS',
  'KPR_PROCESS',
  'UNDER_CONSTRUCTION',
  'HANDOVER',
  'COMPLETED',
]);

// Payment Type enum
export const paymentTypeSchema = z.enum(['cash', 'kpr']).optional();

// Create Purchase Transaction Schema
export const createPurchaseTransactionSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  unitId: z.number().int().positive('Unit ID harus positif'),
  state: z.literal('DRAFT').default('DRAFT'),
  paymentType: paymentTypeSchema,
});

// Update Purchase Transaction State Schema
export const updatePurchaseTransactionStateSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  toState: purchaseTransactionStateSchema,
  paymentType: paymentTypeSchema,
  notes: z.string().optional(),
});

// Booking Fee Payment Schema
export const bookingFeePaymentSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  bookingFeeAmount: z.number().positive('Booking fee harus positif'),
  bookingDate: z.string().datetime('Format tanggal tidak valid'),
  paymentProofUrl: z.string().url('URL bukti pembayaran tidak valid'),
});

export type CreatePurchaseTransactionInput = z.infer<typeof createPurchaseTransactionSchema>;
export type UpdatePurchaseTransactionStateInput = z.infer<typeof updatePurchaseTransactionStateSchema>;
export type BookingFeePaymentInput = z.infer<typeof bookingFeePaymentSchema>;

