'use server';

import { db } from '@/lib/db';
import { createNotificationSchema, updateNotificationSchema, markNotificationReadSchema, markAllNotificationsReadSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Notification Operations
 */

export async function createNotification(data: z.infer<typeof createNotificationSchema>) {
  try {
    // Validate input
    const validatedData = createNotificationSchema.parse(data);

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

    // Create notification
    const notification = await db.notification.create({
      data: {
        userId: validatedData.userId,
        title: validatedData.title,
        description: validatedData.description,
        href: validatedData.href || null,
        type: validatedData.type,
      },
    });

    // Transform response
    const transformedNotification = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      description: notification.description,
      href: notification.href,
      type: notification.type,
      read: notification.read,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
    };

    revalidatePath('/notifications');
    revalidatePath('/api/notifications');

    return {
      success: true,
      data: transformedNotification,
    };
  } catch (error) {
    console.error('Error creating notification:', error);

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
        message: 'Failed to create notification',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateNotification(
  id: string,
  data: Partial<z.infer<typeof updateNotificationSchema>>
) {
  try {
    // Check if notification exists
    const existingNotification = await db.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      return {
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updateNotificationSchema.parse({ ...data, id });

    // Update notification
    const updateData: any = {};
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.href !== undefined) updateData.href = validatedData.href || null;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.read !== undefined) {
      updateData.read = validatedData.read;
      if (validatedData.read && !existingNotification.read) {
        updateData.readAt = new Date();
      } else if (!validatedData.read) {
        updateData.readAt = null;
      }
    }

    const notification = await db.notification.update({
      where: { id },
      data: updateData,
    });

    // Transform response
    const transformedNotification = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      description: notification.description,
      href: notification.href,
      type: notification.type,
      read: notification.read,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
    };

    revalidatePath('/notifications');
    revalidatePath('/api/notifications');

    return {
      success: true,
      data: transformedNotification,
    };
  } catch (error) {
    console.error('Error updating notification:', error);

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
        message: 'Failed to update notification',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteNotification(id: string) {
  try {
    // Check if notification exists
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return {
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete notification
    await db.notification.delete({
      where: { id },
    });

    revalidatePath('/notifications');
    revalidatePath('/api/notifications');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting notification:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete notification',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getNotification(id: string) {
  try {
    const notification = await db.notification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!notification) {
      return {
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform response
    const transformedNotification = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      description: notification.description,
      href: notification.href,
      type: notification.type,
      read: notification.read,
      readAt: notification.readAt?.toISOString(),
      createdAt: notification.createdAt.toISOString(),
    };

    return {
      success: true,
      data: transformedNotification,
    };
  } catch (error) {
    console.error('Error fetching notification:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch notification',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getNotifications(options?: {
  page?: number;
  limit?: number;
  userId?: string;
  read?: boolean;
  type?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.read !== undefined) where.read = options.read;
    if (options?.type) where.type = options.type;

    // Get notifications dengan pagination
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.notification.count({ where }),
      options?.userId && options?.read === undefined
        ? db.notification.count({ where: { ...where, read: false } })
        : Promise.resolve(undefined),
    ]);

    // Transform response
    const transformedNotifications = notifications.map((notif) => ({
      id: notif.id,
      userId: notif.userId,
      title: notif.title,
      description: notif.description,
      href: notif.href,
      type: notif.type,
      read: notif.read,
      readAt: notif.readAt?.toISOString(),
      createdAt: notif.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: transformedNotifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount: unreadCount,
      },
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch notifications',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    // Check if notification exists
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return {
        success: false,
        error: {
          message: 'Notification not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    // Transform response
    const transformedNotification = {
      id: updatedNotification.id,
      userId: updatedNotification.userId,
      title: updatedNotification.title,
      description: updatedNotification.description,
      href: updatedNotification.href,
      type: updatedNotification.type,
      read: updatedNotification.read,
      readAt: updatedNotification.readAt?.toISOString(),
      createdAt: updatedNotification.createdAt.toISOString(),
    };

    revalidatePath('/notifications');
    revalidatePath('/api/notifications');

    return {
      success: true,
      data: transformedNotification,
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);

    return {
      success: false,
      error: {
        message: 'Failed to mark notification as read',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
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

    // Update all unread notifications untuk user
    const result = await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    revalidatePath('/notifications');
    revalidatePath('/api/notifications');

    return {
      success: true,
      data: {
        updatedCount: result.count,
      },
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);

    return {
      success: false,
      error: {
        message: 'Failed to mark all notifications as read',
        code: 'UPDATE_ERROR',
      },
    };
  }
}



