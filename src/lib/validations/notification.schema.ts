import { z } from 'zod';

// Notification Create Schema
export const createNotificationSchema = z.object({
  userId: z.string().cuid('ID user tidak valid'),
  title: z.string().min(1, 'Title wajib diisi'),
  description: z.string().min(1, 'Description wajib diisi'),
  href: z.string().url('URL tidak valid').optional().or(z.literal('')),
  type: z.enum([
    'property_match',
    'funding_update',
    'document_added',
    'welcome',
    'property_submission',
    'new_user',
    'payment_verification',
    'project_update',
    'payment_due',
    'payment_received',
  ], {
    required_error: 'Tipe notifikasi wajib dipilih',
  }),
});

// Notification Update Schema
export const updateNotificationSchema = createNotificationSchema.partial().extend({
  id: z.string().cuid('ID notification tidak valid'),
  read: z.boolean().optional(),
});

// Mark as Read Schema
export const markNotificationReadSchema = z.object({
  id: z.string().cuid('ID notification tidak valid'),
});

// Mark All as Read Schema
export const markAllNotificationsReadSchema = z.object({
  userId: z.string().cuid('ID user tidak valid'),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type MarkAllNotificationsReadInput = z.infer<typeof markAllNotificationsReadSchema>;

