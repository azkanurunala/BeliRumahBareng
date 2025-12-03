import { z } from 'zod';

// Progress Detail Create Schema
export const createProgressDetailSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  category: z.enum(['kyc', 'funding', 'legal', 'closing'], {
    required_error: 'Category wajib dipilih',
  }),
  title: z.string().min(1, 'Title wajib diisi'),
  percentage: z.number().int().min(0).max(100).default(0),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Progress Detail Update Schema
export const updateProgressDetailSchema = createProgressDetailSchema.partial().extend({
  id: z.string().cuid('ID progress detail tidak valid'),
});

// Progress Checklist Item Create Schema
export const createProgressChecklistItemSchema = z.object({
  progressDetailId: z.string().cuid('ID progress detail tidak valid'),
  label: z.string().min(1, 'Label wajib diisi'),
  order: z.number().int().min(0).default(0),
});

// Progress Checklist Item Update Schema
export const updateProgressChecklistItemSchema = z.object({
  id: z.string().cuid('ID checklist item tidak valid'),
  label: z.string().min(1, 'Label wajib diisi').optional(),
  completed: z.boolean().optional(),
  completedBy: z.string().cuid('ID user tidak valid').optional(),
  completedAt: z.string().datetime('Format tanggal tidak valid').optional(),
  order: z.number().int().min(0).optional(),
});

// Progress Checklist Item Complete Schema
export const completeProgressChecklistItemSchema = z.object({
  id: z.string().cuid('ID checklist item tidak valid'),
  completedBy: z.string().cuid('ID user tidak valid'),
});

// Progress Milestone Create Schema
export const createProgressMilestoneSchema = z.object({
  progressDetailId: z.string().cuid('ID progress detail tidak valid'),
  label: z.string().min(1, 'Label wajib diisi'),
  date: z.string().datetime('Format tanggal tidak valid').optional(),
  status: z.enum(['completed', 'pending', 'upcoming'], {
    required_error: 'Status wajib dipilih',
  }),
  order: z.number().int().min(0).default(0),
});

// Progress Milestone Update Schema
export const updateProgressMilestoneSchema = createProgressMilestoneSchema.partial().extend({
  id: z.string().cuid('ID milestone tidak valid'),
});

// Progress Completed Member Schema
export const addProgressCompletedMemberSchema = z.object({
  progressDetailId: z.string().cuid('ID progress detail tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
});

// Project Message Create Schema
export const createProjectMessageSchema = z.object({
  projectId: z.string().cuid('ID project tidak valid'),
  userId: z.string().cuid('ID user tidak valid'),
  message: z.string().min(1, 'Message wajib diisi'),
});

// Project Message Update Schema
export const updateProjectMessageSchema = z.object({
  id: z.string().cuid('ID message tidak valid'),
  message: z.string().min(1, 'Message wajib diisi'),
});

export type CreateProgressDetailInput = z.infer<typeof createProgressDetailSchema>;
export type UpdateProgressDetailInput = z.infer<typeof updateProgressDetailSchema>;
export type CreateProgressChecklistItemInput = z.infer<typeof createProgressChecklistItemSchema>;
export type UpdateProgressChecklistItemInput = z.infer<typeof updateProgressChecklistItemSchema>;
export type CompleteProgressChecklistItemInput = z.infer<typeof completeProgressChecklistItemSchema>;
export type CreateProgressMilestoneInput = z.infer<typeof createProgressMilestoneSchema>;
export type UpdateProgressMilestoneInput = z.infer<typeof updateProgressMilestoneSchema>;
export type AddProgressCompletedMemberInput = z.infer<typeof addProgressCompletedMemberSchema>;
export type CreateProjectMessageInput = z.infer<typeof createProjectMessageSchema>;
export type UpdateProjectMessageInput = z.infer<typeof updateProjectMessageSchema>;

