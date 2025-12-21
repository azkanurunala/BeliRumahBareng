'use server';

import { db } from '@/lib/db';
import {
  createProgressDetailSchema,
  updateProgressDetailSchema,
  createProgressChecklistItemSchema,
  updateProgressChecklistItemSchema,
  completeProgressChecklistItemSchema,
  createProgressMilestoneSchema,
  updateProgressMilestoneSchema,
  addProgressCompletedMemberSchema,
} from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { calculateKYCProgress, calculateLegalProgress, calculateClosingProgress, autoGenerateMilestoneFromChecklist, generateDefaultChecklistItems } from '@/lib/progress-calculator';
import { updateProjectProgress } from './project.actions';
import { generateLegalProgressData } from '@/lib/legal-progress-helpers';
import { generateFundingProgressData } from '@/lib/funding-progress-helpers';

/**
 * Server Actions untuk Progress Operations
 */

// Progress Detail Actions
export async function createProgressDetail(data: z.infer<typeof createProgressDetailSchema>) {
  try {
    const validatedData = createProgressDetailSchema.parse(data);
    const project = await db.project.findUnique({ where: { id: validatedData.projectId } });
    if (!project) {
      return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
    }

    const existing = await db.progressDetail.findUnique({
      where: { projectId_category: { projectId: validatedData.projectId, category: validatedData.category } },
    });
    if (existing) {
      return { success: false, error: { message: `Progress detail with category '${validatedData.category}' already exists`, code: 'CONFLICT' } };
    }

    const progressDetail = await db.progressDetail.create({
      data: {
        projectId: validatedData.projectId,
        category: validatedData.category,
        title: validatedData.title,
        percentage: validatedData.percentage,
        description: validatedData.description || null,
        notes: validatedData.notes || null,
      },
    });

    // Auto-generate default checklist items for KYC and Closing
    await generateDefaultChecklistItems(progressDetail.id, progressDetail.category);

    // Re-fetch progress detail with checklist items
    const progressDetailWithChecklist = await db.progressDetail.findUnique({
      where: { id: progressDetail.id },
      include: {
        checklist: {
          include: {
            completions: true,
          },
          orderBy: { order: 'asc' },
        },
        completedMembers: true,
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const transformed = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: progressDetailWithChecklist?.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completedMembers: item.completions.map(c => c.userId),
        order: item.order,
      })) || [],
      completedMembers: progressDetailWithChecklist?.completedMembers.map((cm) => cm.userId) || [],
      milestones: progressDetailWithChecklist?.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })) || [],
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error creating progress detail:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to create progress detail', code: 'CREATE_ERROR' } };
  }
}

export async function updateProgressDetail(id: string, data: Partial<z.infer<typeof updateProgressDetailSchema>>) {
  try {
    const existing = await db.progressDetail.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }

    const validatedData = updateProgressDetailSchema.parse({ ...data, id });
    const updateData: any = {};
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.percentage !== undefined) updateData.percentage = validatedData.percentage;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const progressDetail = await db.progressDetail.update({
      where: { id },
      data: updateData,
      include: { 
        checklist: { 
          include: { completions: true },
          orderBy: { order: 'asc' } 
        }, 
        completedMembers: true, 
        milestones: { orderBy: { order: 'asc' } } 
      },
    });

    // Sync percentage dengan project progress fields jika percentage di-update
    if (validatedData.percentage !== undefined) {
      const category = existing.category;
      const progressUpdate: { kyc?: number; funding?: number; legal?: number; closing?: number } = {};
      
      // Map category ke project progress field
      if (category === 'kyc') {
        progressUpdate.kyc = validatedData.percentage;
      } else if (category === 'funding') {
        progressUpdate.funding = validatedData.percentage;
      } else if (category === 'legal') {
        progressUpdate.legal = validatedData.percentage;
      } else if (category === 'closing') {
        progressUpdate.closing = validatedData.percentage;
      }

      // Update project progress jika ada mapping
      if (Object.keys(progressUpdate).length > 0) {
        await updateProjectProgress(progressDetail.projectId, progressUpdate);
      }
    }

    const transformed = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: progressDetail.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completedMembers: item.completions.map(c => c.userId),
        order: item.order,
      })),
      completedMembers: progressDetail.completedMembers.map((cm) => cm.userId),
      milestones: progressDetail.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })),
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    revalidatePath(`/admin/projects/${progressDetail.projectId}/detail`);
    revalidatePath(`/projects/${progressDetail.projectId}`);
    revalidatePath('/api/progress-details');
    revalidatePath('/api/projects');
    revalidatePath(`/api/projects/${progressDetail.projectId}`);
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error updating progress detail:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to update progress detail', code: 'UPDATE_ERROR' } };
  }
}

export async function deleteProgressDetail(id: string) {
  try {
    const progressDetail = await db.progressDetail.findUnique({ where: { id } });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }
    await db.progressDetail.delete({ where: { id } });
    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    revalidatePath('/api/progress-details');
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting progress detail:', error);
    return { success: false, error: { message: 'Failed to delete progress detail', code: 'DELETE_ERROR' } };
  }
}

export async function getProgressDetail(id: string) {
  try {
    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, propertyName: true } },
        checklist: { 
          include: { completions: true },
          orderBy: { order: 'asc' } 
        },
        completedMembers: { include: { user: { select: { id: true, name: true } } } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }

    // For legal category, auto-generate data from document signatures
    if (progressDetail.category === 'legal') {
      const legalData = await generateLegalProgressData(progressDetail.projectId);
      const transformed = {
        id: progressDetail.id,
        projectId: progressDetail.projectId,
        category: progressDetail.category,
        title: progressDetail.title,
        percentage: legalData.percentage,
        description: progressDetail.description,
        notes: progressDetail.notes,
        checklist: legalData.checklist,
        completedMembers: legalData.completedMembers,
        milestones: legalData.milestones,
        createdAt: progressDetail.createdAt.toISOString(),
        updatedAt: progressDetail.updatedAt.toISOString(),
      };
      return { success: true, data: transformed };
    }

    // For funding category, auto-generate data from payment plans and verified payments
    if (progressDetail.category === 'funding') {
      const fundingData = await generateFundingProgressData(progressDetail.projectId);
      const transformed = {
        id: progressDetail.id,
        projectId: progressDetail.projectId,
        category: progressDetail.category,
        title: progressDetail.title,
        percentage: fundingData.percentage,
        description: progressDetail.description,
        notes: progressDetail.notes,
        checklist: fundingData.checklist,
        completedMembers: fundingData.completedMembers,
        milestones: fundingData.milestones,
        createdAt: progressDetail.createdAt.toISOString(),
        updatedAt: progressDetail.updatedAt.toISOString(),
      };
      return { success: true, data: transformed };
    }

    // Use existing data from database for other categories
    const transformed = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: progressDetail.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completedMembers: item.completions.map(c => c.userId),
        order: item.order,
      })),
      completedMembers: progressDetail.completedMembers.map((cm) => cm.userId),
      milestones: progressDetail.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })),
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error fetching progress detail:', error);
    return { success: false, error: { message: 'Failed to fetch progress detail', code: 'FETCH_ERROR' } };
  }
}

export async function getProgressDetails(options?: { page?: number; limit?: number; projectId?: string; category?: string }) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.category) where.category = options.category;

    const [progressDetails, total] = await Promise.all([
      db.progressDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, propertyName: true } },
          checklist: { 
            include: { completions: true },
            orderBy: { order: 'asc' } 
          },
          completedMembers: true,
          milestones: { orderBy: { order: 'asc' } },
        },
      }),
      db.progressDetail.count({ where }),
    ]);

    const transformed = await Promise.all(
      progressDetails.map(async (pd) => {
        // For legal category, auto-generate data from document signatures
        if (pd.category === 'legal') {
          const legalData = await generateLegalProgressData(pd.projectId);
          return {
            id: pd.id,
            projectId: pd.projectId,
            category: pd.category,
            title: pd.title,
            percentage: legalData.percentage,
            description: pd.description,
            notes: pd.notes,
            checklist: legalData.checklist,
            completedMembers: legalData.completedMembers,
            milestones: legalData.milestones,
            createdAt: pd.createdAt.toISOString(),
            updatedAt: pd.updatedAt.toISOString(),
          };
        }

        // For funding category, auto-generate data from payment plans and verified payments
        if (pd.category === 'funding') {
          const fundingData = await generateFundingProgressData(pd.projectId);
          return {
            id: pd.id,
            projectId: pd.projectId,
            category: pd.category,
            title: pd.title,
            percentage: fundingData.percentage,
            description: pd.description,
            notes: pd.notes,
            checklist: fundingData.checklist,
            completedMembers: fundingData.completedMembers,
            milestones: fundingData.milestones,
            createdAt: pd.createdAt.toISOString(),
            updatedAt: pd.updatedAt.toISOString(),
          };
        }

        // Use existing data from database for other categories
        return {
          id: pd.id,
          projectId: pd.projectId,
          category: pd.category,
          title: pd.title,
          percentage: pd.percentage,
          description: pd.description,
          notes: pd.notes,
          checklist: pd.checklist.map((item) => ({
            id: item.id,
            label: item.label,
            completedMembers: item.completions.map(c => c.userId),
            order: item.order,
          })),
          completedMembers: pd.completedMembers.map((cm) => cm.userId),
          milestones: pd.milestones.map((m) => ({
            id: m.id,
            label: m.label,
            date: m.date?.toISOString(),
            status: m.status,
            order: m.order,
          })),
          createdAt: pd.createdAt.toISOString(),
          updatedAt: pd.updatedAt.toISOString(),
        };
      })
    );

    return { success: true, data: transformed, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  } catch (error) {
    console.error('Error fetching progress details:', error);
    return { success: false, error: { message: 'Failed to fetch progress details', code: 'FETCH_ERROR' } };
  }
}

// Checklist Item Actions
export async function createProgressChecklistItem(data: z.infer<typeof createProgressChecklistItemSchema>) {
  try {
    const validatedData = createProgressChecklistItemSchema.parse(data);
    const progressDetail = await db.progressDetail.findUnique({ where: { id: validatedData.progressDetailId } });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }

    const item = await db.progressChecklistItem.create({
      data: { progressDetailId: validatedData.progressDetailId, label: validatedData.label, order: validatedData.order },
      include: {
        completions: true,
      },
    });

    const transformed = {
      id: item.id,
      progressDetailId: item.progressDetailId,
      label: item.label,
      completedMembers: item.completions.map(c => c.userId),
      order: item.order,
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error creating checklist item:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to create checklist item', code: 'CREATE_ERROR' } };
  }
}

export async function updateProgressChecklistItem(id: string, data: Partial<z.infer<typeof updateProgressChecklistItemSchema>>) {
  try {
    const existing = await db.progressChecklistItem.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: { message: 'Checklist item not found', code: 'NOT_FOUND' } };
    }

    const validatedData = updateProgressChecklistItemSchema.parse({ ...data, id });
    const updateData: any = {};
    if (validatedData.label !== undefined) updateData.label = validatedData.label;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const item = await db.progressChecklistItem.update({ 
      where: { id }, 
      data: updateData,
      include: {
        completions: true,
      },
    });

    const transformed = {
      id: item.id,
      progressDetailId: item.progressDetailId,
      label: item.label,
      completedMembers: item.completions.map(c => c.userId),
      order: item.order,
    };

    const progressDetail = await db.progressDetail.findUnique({ where: { id: item.progressDetailId } });
    if (progressDetail) {
      revalidatePath('/admin/projects');
      revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error updating checklist item:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to update checklist item', code: 'UPDATE_ERROR' } };
  }
}

export async function deleteProgressChecklistItem(id: string) {
  try {
    const item = await db.progressChecklistItem.findUnique({ where: { id } });
    if (!item) {
      return { success: false, error: { message: 'Checklist item not found', code: 'NOT_FOUND' } };
    }
    await db.progressChecklistItem.delete({ where: { id } });
    const progressDetail = await db.progressDetail.findUnique({ where: { id: item.progressDetailId } });
    if (progressDetail) {
      revalidatePath('/admin/projects');
      revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    return { success: false, error: { message: 'Failed to delete checklist item', code: 'DELETE_ERROR' } };
  }
}

export async function completeProgressChecklistItem(data: z.infer<typeof completeProgressChecklistItemSchema>) {
  try {
    const validatedData = completeProgressChecklistItemSchema.parse(data);
    const item = await db.progressChecklistItem.findUnique({ 
      where: { id: validatedData.id },
      include: {
        completions: true,
      },
    });
    if (!item) {
      return { success: false, error: { message: 'Checklist item not found', code: 'NOT_FOUND' } };
    }
    const completer = await db.user.findUnique({ where: { id: validatedData.completedBy } });
    if (!completer) {
      return { success: false, error: { message: 'Completer not found', code: 'NOT_FOUND' } };
    }

    // Check if completion already exists
    const existingCompletion = item.completions.find(c => c.userId === validatedData.completedBy);
    if (existingCompletion) {
      // Already completed by this user, return existing data
      const transformed = {
        id: item.id,
        progressDetailId: item.progressDetailId,
        label: item.label,
        completedMembers: item.completions.map(c => c.userId),
        order: item.order,
      };
      return { success: true, data: transformed };
    }

    // Create new completion entry
    await db.checklistItemCompletion.create({
      data: {
        checklistItemId: validatedData.id,
        userId: validatedData.completedBy,
        completedAt: new Date(),
      },
    });

    // Re-fetch item with updated completions
    const updated = await db.progressChecklistItem.findUnique({
      where: { id: validatedData.id },
      include: {
        completions: true,
      },
    });

    if (!updated) {
      return { success: false, error: { message: 'Failed to fetch updated item', code: 'FETCH_ERROR' } };
    }

    const transformed = {
      id: updated.id,
      progressDetailId: updated.progressDetailId,
      label: updated.label,
      completedMembers: updated.completions.map(c => c.userId),
      order: updated.order,
    };

    const progressDetail = await db.progressDetail.findUnique({ 
      where: { id: updated.progressDetailId },
      include: {
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (progressDetail) {
      // Calculate and update progress based on category
      if (progressDetail.category === 'kyc') {
        const progressValue = await calculateKYCProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { kyc: progressValue });
      } else if (progressDetail.category === 'legal') {
        const progressValue = await calculateLegalProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { legal: progressValue });
      } else if (progressDetail.category === 'closing') {
        const progressValue = await calculateClosingProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { closing: progressValue });
      }

      // Auto-generate milestone when all members complete this checklist item
      if (progressDetail.category === 'kyc' || progressDetail.category === 'closing') {
        const totalMembers = progressDetail.project.members.length;
        const completedMembersCount = updated.completions.length;
        
        // If all members have completed this item, generate milestone
        if (totalMembers > 0 && completedMembersCount >= totalMembers) {
          await autoGenerateMilestoneFromChecklist(updated.progressDetailId, updated.id);
        }
      }

      revalidatePath('/admin/projects');
      revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error completing checklist item:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to complete checklist item', code: 'UPDATE_ERROR' } };
  }
}

/**
 * Remove completion for a user from a checklist item
 */
export async function uncompleteProgressChecklistItem(checklistItemId: string, userId: string) {
  try {
    const item = await db.progressChecklistItem.findUnique({ 
      where: { id: checklistItemId },
      include: {
        completions: true,
      },
    });
    if (!item) {
      return { success: false, error: { message: 'Checklist item not found', code: 'NOT_FOUND' } };
    }

    // Delete completion entry
    await db.checklistItemCompletion.deleteMany({
      where: {
        checklistItemId,
        userId,
      },
    });

    // Re-fetch item with updated completions
    const updated = await db.progressChecklistItem.findUnique({
      where: { id: checklistItemId },
      include: {
        completions: true,
      },
    });

    if (!updated) {
      return { success: false, error: { message: 'Failed to fetch updated item', code: 'FETCH_ERROR' } };
    }

    const transformed = {
      id: updated.id,
      progressDetailId: updated.progressDetailId,
      label: updated.label,
      completedMembers: updated.completions.map(c => c.userId),
      order: updated.order,
    };

    const progressDetail = await db.progressDetail.findUnique({ where: { id: updated.progressDetailId } });
    if (progressDetail) {
      // Recalculate progress
      if (progressDetail.category === 'kyc') {
        const progressValue = await calculateKYCProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { kyc: progressValue });
      } else if (progressDetail.category === 'legal') {
        const progressValue = await calculateLegalProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { legal: progressValue });
      } else if (progressDetail.category === 'closing') {
        const progressValue = await calculateClosingProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { closing: progressValue });
      }

      revalidatePath('/admin/projects');
      revalidatePath(`/admin/projects/${progressDetail.projectId}`);
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error uncompleting checklist item:', error);
    return { success: false, error: { message: 'Failed to uncomplete checklist item', code: 'UPDATE_ERROR' } };
  }
}

// Milestone Actions
export async function createProgressMilestone(data: z.infer<typeof createProgressMilestoneSchema>) {
  try {
    const validatedData = createProgressMilestoneSchema.parse(data);
    const progressDetail = await db.progressDetail.findUnique({ where: { id: validatedData.progressDetailId } });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }

    const milestone = await db.progressMilestone.create({
      data: {
        progressDetailId: validatedData.progressDetailId,
        label: validatedData.label,
        date: validatedData.date ? new Date(validatedData.date) : null,
        status: validatedData.status,
        order: validatedData.order,
      },
    });

    const transformed = {
      id: milestone.id,
      progressDetailId: milestone.progressDetailId,
      label: milestone.label,
      date: milestone.date?.toISOString(),
      status: milestone.status,
      order: milestone.order,
    };

    const progressDetail2 = await db.progressDetail.findUnique({ where: { id: validatedData.progressDetailId } });
    if (progressDetail2) {
      // Calculate and update closing progress if milestone is created as completed
      if (progressDetail2.category === 'closing' && validatedData.status === 'completed') {
        const progressValue = await calculateClosingProgress(progressDetail2.projectId);
        await updateProjectProgress(progressDetail2.projectId, { closing: progressValue });
      }

      const project = await db.project.findUnique({ where: { id: progressDetail2.projectId } });
      if (project) {
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/${project.id}`);
      }
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error creating milestone:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to create milestone', code: 'CREATE_ERROR' } };
  }
}

export async function updateProgressMilestone(id: string, data: Partial<z.infer<typeof updateProgressMilestoneSchema>>) {
  try {
    const existing = await db.progressMilestone.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: { message: 'Milestone not found', code: 'NOT_FOUND' } };
    }

    const validatedData = updateProgressMilestoneSchema.parse({ ...data, id });
    const updateData: any = {};
    if (validatedData.label !== undefined) updateData.label = validatedData.label;
    if (validatedData.date !== undefined) updateData.date = validatedData.date ? new Date(validatedData.date) : null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const milestone = await db.progressMilestone.update({ where: { id }, data: updateData });
    const transformed = {
      id: milestone.id,
      progressDetailId: milestone.progressDetailId,
      label: milestone.label,
      date: milestone.date?.toISOString(),
      status: milestone.status,
      order: milestone.order,
    };

    const progressDetail = await db.progressDetail.findUnique({ where: { id: milestone.progressDetailId } });
    if (progressDetail) {
      // Calculate and update closing progress when milestone status changes
      if (progressDetail.category === 'closing' && validatedData.status === 'completed') {
        const progressValue = await calculateClosingProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { closing: progressValue });
      }

      const project = await db.project.findUnique({ where: { id: progressDetail.projectId } });
      if (project) {
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/${project.id}`);
      }
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error updating milestone:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to update milestone', code: 'UPDATE_ERROR' } };
  }
}

export async function deleteProgressMilestone(id: string) {
  try {
    const milestone = await db.progressMilestone.findUnique({ where: { id } });
    if (!milestone) {
      return { success: false, error: { message: 'Milestone not found', code: 'NOT_FOUND' } };
    }
    await db.progressMilestone.delete({ where: { id } });
    const progressDetail = await db.progressDetail.findUnique({ where: { id: milestone.progressDetailId } });
    if (progressDetail) {
      const project = await db.project.findUnique({ where: { id: progressDetail.projectId } });
      if (project) {
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/${project.id}`);
      }
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: { id } };
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return { success: false, error: { message: 'Failed to delete milestone', code: 'DELETE_ERROR' } };
  }
}

// Completed Member Actions
export async function addProgressCompletedMember(data: z.infer<typeof addProgressCompletedMemberSchema>) {
  try {
    const validatedData = addProgressCompletedMemberSchema.parse(data);
    const progressDetail = await db.progressDetail.findUnique({ where: { id: validatedData.progressDetailId } });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
    }
    const user = await db.user.findUnique({ where: { id: validatedData.userId } });
    if (!user) {
      return { success: false, error: { message: 'User not found', code: 'NOT_FOUND' } };
    }

    const existing = await db.progressCompletedMember.findUnique({
      where: { progressDetailId_userId: { progressDetailId: validatedData.progressDetailId, userId: validatedData.userId } },
    });
    if (existing) {
      return { success: false, error: { message: 'User has already completed this progress', code: 'CONFLICT' } };
    }

    const member = await db.progressCompletedMember.create({
      data: { progressDetailId: validatedData.progressDetailId, userId: validatedData.userId },
    });

    const transformed = {
      id: member.id,
      progressDetailId: member.progressDetailId,
      userId: member.userId,
      completedAt: member.completedAt.toISOString(),
    };

    const progressDetail2 = await db.progressDetail.findUnique({ where: { id: validatedData.progressDetailId } });
    if (progressDetail2) {
      // Calculate and update KYC progress when member completes
      if (progressDetail2.category === 'kyc') {
        const progressValue = await calculateKYCProgress(progressDetail2.projectId);
        await updateProjectProgress(progressDetail2.projectId, { kyc: progressValue });
      }

      const project = await db.project.findUnique({ where: { id: progressDetail2.projectId } });
      if (project) {
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/${project.id}`);
      }
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error adding completed member:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: { message: 'Validation error', code: 'VALIDATION_ERROR', errors: error.flatten().fieldErrors } };
    }
    return { success: false, error: { message: 'Failed to add completed member', code: 'CREATE_ERROR' } };
  }
}

export async function removeProgressCompletedMember(progressDetailId: string, userId: string) {
  try {
    const member = await db.progressCompletedMember.findUnique({
      where: { progressDetailId_userId: { progressDetailId, userId } },
    });
    if (!member) {
      return { success: false, error: { message: 'Completed member not found', code: 'NOT_FOUND' } };
    }
    await db.progressCompletedMember.delete({
      where: { progressDetailId_userId: { progressDetailId, userId } },
    });

    const progressDetail = await db.progressDetail.findUnique({ where: { id: progressDetailId } });
    if (progressDetail) {
      const project = await db.project.findUnique({ where: { id: progressDetail.projectId } });
      if (project) {
        revalidatePath('/admin/projects');
        revalidatePath(`/admin/projects/${project.id}`);
      }
    }
    revalidatePath('/api/progress-details');
    return { success: true, data: { progressDetailId, userId } };
  } catch (error) {
    console.error('Error removing completed member:', error);
    return { success: false, error: { message: 'Failed to remove completed member', code: 'DELETE_ERROR' } };
  }
}





