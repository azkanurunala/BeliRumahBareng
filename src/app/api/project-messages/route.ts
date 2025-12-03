import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProjectMessageSchema, updateProjectMessageSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/project-messages - Get all project messages dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const projectId = searchParams.get('projectId') || '';
    const userId = searchParams.get('userId') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    // Get project messages dengan pagination
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

    // Transform ke format yang diharapkan frontend
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      projectId: msg.projectId,
      userId: msg.userId,
      message: msg.message,
      timestamp: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedMessages,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching project messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch project messages',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/project-messages - Create new project message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createProjectMessageSchema.parse(body);

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
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

    return NextResponse.json(
      {
        success: true,
        data: transformedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project message:', error);

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
          message: 'Failed to create project message',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

