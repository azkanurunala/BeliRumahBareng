import { z } from 'zod';

// Appointment Type enum
export const appointmentTypeSchema = z.enum(['interview', 'notaris', 'bank']);

// Appointment Status enum
export const appointmentStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']);

// Create Appointment Schema
export const createAppointmentSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  type: appointmentTypeSchema,
  scheduledDate: z.string().datetime('Format tanggal tidak valid'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// Update Appointment Schema
export const updateAppointmentSchema = z.object({
  appointmentId: z.string().cuid('ID appointment tidak valid'),
  scheduledDate: z.string().datetime('Format tanggal tidak valid').optional(),
  status: appointmentStatusSchema.optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().datetime('Format tanggal tidak valid').optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

