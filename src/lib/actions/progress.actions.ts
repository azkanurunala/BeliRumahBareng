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

    const transformed = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: [],
      completedMembers: [],
      milestones: [],
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
      include: { checklist: { orderBy: { order: 'asc' } }, completedMembers: true, milestones: { orderBy: { order: 'asc' } } },
    });

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
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
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
    revalidatePath('/api/progress-details');
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
        checklist: { orderBy: { order: 'asc' }, include: { completer: { select: { id: true, name: true } } } },
        completedMembers: { include: { user: { select: { id: true, name: true } } } },
        milestones: { orderBy: { order: 'asc' } },
      },
    });
    if (!progressDetail) {
      return { success: false, error: { message: 'Progress detail not found', code: 'NOT_FOUND' } };
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
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
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
          checklist: { orderBy: { order: 'asc' } },
          completedMembers: true,
          milestones: { orderBy: { order: 'asc' } },
        },
      }),
      db.progressDetail.count({ where }),
    ]);

    const transformed = progressDetails.map((pd) => ({
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
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
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
    }));

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
    });

    const transformed = {
      id: item.id,
      progressDetailId: item.progressDetailId,
      label: item.label,
      completed: item.completed,
      completedBy: item.completedBy,
      completedAt: item.completedAt?.toISOString(),
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
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
      if (validatedData.completed && !existing.completed) {
        updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : new Date();
        if (validatedData.completedBy) updateData.completedBy = validatedData.completedBy;
      } else if (!validatedData.completed) {
        updateData.completedAt = null;
        updateData.completedBy = null;
      }
    }
    if (validatedData.completedBy !== undefined) updateData.completedBy = validatedData.completedBy || null;
    if (validatedData.completedAt !== undefined) updateData.completedAt = validatedData.completedAt ? new Date(validatedData.completedAt) : null;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const item = await db.progressChecklistItem.update({ where: { id }, data: updateData });
    const transformed = {
      id: item.id,
      progressDetailId: item.progressDetailId,
      label: item.label,
      completed: item.completed,
      completedBy: item.completedBy,
      completedAt: item.completedAt?.toISOString(),
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
    const item = await db.progressChecklistItem.findUnique({ where: { id: validatedData.id } });
    if (!item) {
      return { success: false, error: { message: 'Checklist item not found', code: 'NOT_FOUND' } };
    }
    const completer = await db.user.findUnique({ where: { id: validatedData.completedBy } });
    if (!completer) {
      return { success: false, error: { message: 'Completer not found', code: 'NOT_FOUND' } };
    }

    const updated = await db.progressChecklistItem.update({
      where: { id: validatedData.id },
      data: { completed: true, completedBy: validatedData.completedBy, completedAt: new Date() },
    });

    const transformed = {
      id: updated.id,
      progressDetailId: updated.progressDetailId,
      label: updated.label,
      completed: updated.completed,
      completedBy: updated.completedBy,
      completedAt: updated.completedAt?.toISOString(),
      order: updated.order,
    };

    const progressDetail = await db.progressDetail.findUnique({ where: { id: updated.progressDetailId } });
    if (progressDetail) {
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



