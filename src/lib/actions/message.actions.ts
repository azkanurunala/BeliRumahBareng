'use server';

import { db } from '@/lib/db';
import { createProjectMessageSchema, updateProjectMessageSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Project Message Operations
 */

export async function createProjectMessage(data: z.infer<typeof createProjectMessageSchema>) {
  try {
    // Validate input
    const validatedData = createProjectMessageSchema.parse(data);

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      return {
        success: false,
        error: {
          message: 'Project not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Create project message
    const message = await db.projectMessage.create({
      data: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        message: validatedData.message,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
    });

    // Transform response
    const transformedMessage = {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      message: message.message,
      timestamp: message.createdAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${validatedData.projectId}`);
    revalidatePath('/api/project-messages');

    return {
      success: true,
      data: transformedMessage,
    };
  } catch (error) {
    console.error('Error creating project message:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to create project message',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateProjectMessage(
  id: string,
  data: Partial<z.infer<typeof updateProjectMessageSchema>>
) {
  try {
    // Check if message exists
    const existingMessage = await db.projectMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      return {
        success: false,
        error: {
          message: 'Project message not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updateProjectMessageSchema.parse({ ...data, id });

    // Update message
    const message = await db.projectMessage.update({
      where: { id },
      data: {
        message: validatedData.message,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
    });

    // Transform response
    const transformedMessage = {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      message: message.message,
      timestamp: message.createdAt.toISOString(),
    };

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${message.projectId}`);
    revalidatePath('/api/project-messages');

    return {
      success: true,
      data: transformedMessage,
    };
  } catch (error) {
    console.error('Error updating project message:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to update project message',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteProjectMessage(id: string) {
  try {
    // Check if message exists
    const message = await db.projectMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return {
        success: false,
        error: {
          message: 'Project message not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete message
    await db.projectMessage.delete({
      where: { id },
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${message.projectId}`);
    revalidatePath('/api/project-messages');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting project message:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete project message',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getProjectMessage(id: string) {
  try {
    const message = await db.projectMessage.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
    });

    if (!message) {
      return {
        success: false,
        error: {
          message: 'Project message not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform response
    const transformedMessage = {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      message: message.message,
      timestamp: message.createdAt.toISOString(),
    };

    return {
      success: true,
      data: transformedMessage,
    };
  } catch (error) {
    console.error('Error fetching project message:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch project message',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getProjectMessages(options?: {
  page?: number;
  limit?: number;
  projectId?: string;
  userId?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.userId) where.userId = options.userId;

    // Get messages dengan pagination
    const [messages, total] = await Promise.all([
      db.projectMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              propertyName: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              avatarHint: true,
            },
          },
        },
      }),
      db.projectMessage.count({ where }),
    ]);

    // Transform response
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      projectId: msg.projectId,
      userId: msg.userId,
      message: msg.message,
      timestamp: msg.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: transformedMessages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching project messages:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch project messages',
        code: 'FETCH_ERROR',
      },
    };
  }
}








