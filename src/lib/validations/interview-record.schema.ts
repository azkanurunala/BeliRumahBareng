import { z } from 'zod';

// Interview Result enum
export const interviewResultSchema = z.enum(['PASSED', 'FAILED', 'NEED_FOLLOW_UP']);

// Create Interview Record Schema
export const createInterviewRecordSchema = z.object({
  transactionId: z.string().cuid('ID transaction tidak valid'),
  interviewDate: z.string().datetime('Format tanggal tidak valid'),
  interviewerId: z.string().cuid('ID interviewer tidak valid').optional(), // Optional - will be set from auth
  result: interviewResultSchema,
  notes: z.string().optional(),
});

export type CreateInterviewRecordInput = z.infer<typeof createInterviewRecordSchema>;

