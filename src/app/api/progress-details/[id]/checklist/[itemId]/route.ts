import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProgressChecklistItemSchema, completeProgressChecklistItemSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { calculateKYCProgress, calculateLegalProgress, calculateClosingProgress, autoGenerateMilestoneFromChecklist } from '@/lib/progress-calculator';
import { updateProjectProgress } from '@/lib/actions/project.actions';

// PUT /api/progress-details/[id]/checklist/[itemId] - Update checklist item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const body = await request.json();

    // Check if checklist item exists
    const existingItem = await db.progressChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      throw new NotFoundError('Checklist item not found');
    }

    // Validate input dengan ID
    const validatedData = updateProgressChecklistItemSchema.parse({ ...body, id: itemId });

    // Update checklist item (only label and order, not completion status)
    const updateData: any = {};
    if (validatedData.label !== undefined) updateData.label = validatedData.label;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const checklistItem = await db.progressChecklistItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        completions: true,
      },
    });

    // Transform response
    const transformedItem = {
      id: checklistItem.id,
      progressDetailId: checklistItem.progressDetailId,
      label: checklistItem.label,
      completedMembers: checklistItem.completions.map(c => c.userId),
      order: checklistItem.order,
    };

    return NextResponse.json({
      success: true,
      data: transformedItem,
    });
  } catch (error) {
    console.error('Error updating checklist item:', error);

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
          message: 'Failed to update checklist item',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/progress-details/[id]/checklist/[itemId] - Delete checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // Check if checklist item exists
    const checklistItem = await db.progressChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!checklistItem) {
      throw new NotFoundError('Checklist item not found');
    }

    // Delete checklist item
    await db.progressChecklistItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      data: { id: itemId },
    });
  } catch (error) {
    console.error('Error deleting checklist item:', error);

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
          message: 'Failed to delete checklist item',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








