import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProjectMessageSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/project-messages/[id] - Get project message by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      throw new NotFoundError('Project message not found');
    }

    // Transform response
    const transformedMessage = {
      id: message.id,
      projectId: message.projectId,
      userId: message.userId,
      message: message.message,
      timestamp: message.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedMessage,
    });
  } catch (error) {
    console.error('Error fetching project message:', error);

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
          message: 'Failed to fetch project message',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/project-messages/[id] - Update project message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if message exists
    const existingMessage = await db.projectMessage.findUnique({
      where: { id },
    });

    if (!existingMessage) {
      throw new NotFoundError('Project message not found');
    }

    // Validate input dengan ID
    const validatedData = updateProjectMessageSchema.parse({ ...body, id });

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

    return NextResponse.json({
      success: true,
      data: transformedMessage,
    });
  } catch (error) {
    console.error('Error updating project message:', error);

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
          message: 'Failed to update project message',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/project-messages/[id] - Delete project message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if message exists
    const message = await db.projectMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError('Project message not found');
    }

    // Delete message
    await db.projectMessage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting project message:', error);

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
          message: 'Failed to delete project message',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

