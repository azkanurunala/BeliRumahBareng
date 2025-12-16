import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotificationSchema, markAllNotificationsReadSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/notifications - Get all notifications untuk user dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId') || '';
    const read = searchParams.get('read') || '';
    const type = searchParams.get('type') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (read !== '') {
      where.read = read === 'true';
    }
    if (type) where.type = type;

    // Get notifications dengan pagination
    const [notifications, total] = await Promise.all([
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
    ]);

    // Transform ke format yang diharapkan frontend
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

    return NextResponse.json({
      success: true,
      data: transformedNotifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount: read === '' ? await db.notification.count({ where: { ...where, read: false } }) : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch notifications',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createNotificationSchema.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
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

    return NextResponse.json(
      {
        success: true,
        data: transformedNotification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating notification:', error);

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
          message: 'Failed to create notification',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications - Mark all notifications as read untuk user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = markAllNotificationsReadSchema.parse(body);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update all unread notifications untuk user
    const result = await db.notification.updateMany({
      where: {
        userId: validatedData.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);

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
          message: 'Failed to mark all notifications as read',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








