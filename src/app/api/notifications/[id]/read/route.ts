import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { markNotificationReadSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if notification exists
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Mark as read
    const updatedNotification = await db.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
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

    return NextResponse.json({
      success: true,
      data: transformedNotification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to mark notification as read',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

