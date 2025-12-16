'use server';

import { db } from '@/lib/db';
import { createNotification } from '@/lib/actions/notification.actions';

/**
 * Helper functions untuk auto-create notifications
 */

/**
 * Get admin user ID (user dengan role = 2)
 */
async function getAdminUserId(): Promise<string | null> {
  try {
    const admin = await db.user.findFirst({
      where: { role: 2 },
      select: { id: true },
    });
    return admin?.id || null;
  } catch (error) {
    console.error('Error getting admin user ID:', error);
    return null;
  }
}

/**
 * Notification type enum
 */
type NotificationType = 
  | 'property_match'
  | 'funding_update'
  | 'document_added'
  | 'welcome'
  | 'property_submission'
  | 'new_user'
  | 'payment_verification'
  | 'project_update'
  | 'payment_due'
  | 'payment_received';

/**
 * Create notification untuk admin
 */
export async function createNotificationForAdmin(
  title: string,
  description: string,
  type: NotificationType,
  href?: string
) {
  try {
    const adminId = await getAdminUserId();
    if (!adminId) {
      console.warn('No admin user found, skipping notification');
      return { success: false };
    }

    return await createNotification({
      userId: adminId,
      title,
      description,
      type,
      href: href || undefined,
    });
  } catch (error) {
    console.error('Error creating notification for admin:', error);
    return { success: false };
  }
}

/**
 * Create notification untuk user tertentu
 */
export async function createNotificationForUser(
  userId: string,
  title: string,
  description: string,
  type: NotificationType,
  href?: string
) {
  try {
    return await createNotification({
      userId,
      title,
      description,
      type,
      href: href || undefined,
    });
  } catch (error) {
    console.error('Error creating notification for user:', error);
    return { success: false };
  }
}

/**
 * Create notification untuk semua members project
 */
export async function createNotificationForProjectMembers(
  projectId: string,
  title: string,
  description: string,
  type: NotificationType,
  href?: string
) {
  try {
    // Get all members dari project
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project || !project.members.length) {
      return { success: false };
    }

    // Create notification untuk setiap member
    const notifications = await Promise.all(
      project.members.map((member) =>
        createNotification({
          userId: member.userId,
          title,
          description,
          type,
          href: href || undefined,
        })
      )
    );

    return {
      success: notifications.every((n) => n.success),
      count: notifications.filter((n) => n.success).length,
    };
  } catch (error) {
    console.error('Error creating notifications for project members:', error);
    return { success: false };
  }
}






