import { z } from 'zod';

// Construction Checkpoint Progress enum
export const constructionCheckpointProgressSchema = z.union([
  z.literal(25),
  z.literal(50),
  z.literal(75),
  z.literal(100),
]);

// Construction Checkpoint Milestone enum
export const constructionCheckpointMilestoneSchema = z.enum(['foundation', 'structure', 'roofing', 'finishing']);

// Construction Checkpoint Status enum
export const constructionCheckpointStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

// Create/Update Construction Checkpoint Schema
export const createConstructionCheckpointSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  progress: constructionCheckpointProgressSchema,
  milestone: constructionCheckpointMilestoneSchema,
  status: constructionCheckpointStatusSchema,
  startDate: z.string().datetime('Format tanggal tidak valid').optional(),
  completedDate: z.string().datetime('Format tanggal tidak valid').optional(),
  photos: z.array(z.string().url('URL foto tidak valid')).optional(),
  notes: z.string().optional(),
});

// Update Construction Checkpoint Schema
export const updateConstructionCheckpointSchema = createConstructionCheckpointSchema.partial().extend({
  checkpointId: z.string().cuid('ID checkpoint tidak valid'),
});

export type CreateConstructionCheckpointInput = z.infer<typeof createConstructionCheckpointSchema>;
export type UpdateConstructionCheckpointInput = z.infer<typeof updateConstructionCheckpointSchema>;

