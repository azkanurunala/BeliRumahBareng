import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateNotificationSchema, markNotificationReadSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/notifications/[id] - Get notification by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      throw new NotFoundError('Notification not found');
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

    return NextResponse.json({
      success: true,
      data: transformedNotification,
    });
  } catch (error) {
    console.error('Error fetching notification:', error);

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
          message: 'Failed to fetch notification',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[id] - Update notification
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if notification exists
    const existingNotification = await db.notification.findUnique({
      where: { id },
    });

    if (!existingNotification) {
      throw new NotFoundError('Notification not found');
    }

    // Validate input dengan ID
    const validatedData = updateNotificationSchema.parse({ ...body, id });

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

    return NextResponse.json({
      success: true,
      data: transformedNotification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            errors: error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

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
          message: 'Failed to update notification',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
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

    // Delete notification
    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting notification:', error);

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
          message: 'Failed to delete notification',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






