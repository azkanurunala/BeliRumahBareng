import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { completeProgressChecklistItemSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// POST /api/progress-details/[id]/checklist/[itemId]/complete - Mark checklist item as complete
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = completeProgressChecklistItemSchema.parse({ ...body, id: itemId });

    // Check if checklist item exists
    const checklistItem = await db.progressChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!checklistItem) {
      throw new NotFoundError('Checklist item not found');
    }

    // Check if completer exists
    const completer = await db.user.findUnique({
      where: { id: validatedData.completedBy },
    });

    if (!completer) {
      throw new NotFoundError('Completer not found');
    }

    // Update checklist item
    const updatedItem = await db.progressChecklistItem.update({
      where: { id: itemId },
      data: {
        completed: true,
        completedBy: validatedData.completedBy,
        completedAt: new Date(),
      },
      include: {
        completer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedItem = {
      id: updatedItem.id,
      progressDetailId: updatedItem.progressDetailId,
      label: updatedItem.label,
      completed: updatedItem.completed,
      completedBy: updatedItem.completedBy,
      completedAt: updatedItem.completedAt?.toISOString(),
      order: updatedItem.order,
    };

    return NextResponse.json({
      success: true,
      data: transformedItem,
    });
  } catch (error) {
    console.error('Error completing checklist item:', error);

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
          message: 'Failed to complete checklist item',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






