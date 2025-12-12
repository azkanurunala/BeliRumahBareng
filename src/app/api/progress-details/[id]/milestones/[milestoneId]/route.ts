import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProgressMilestoneSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// PUT /api/progress-details/[id]/milestones/[milestoneId] - Update milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params;
    const body = await request.json();

    // Check if milestone exists
    const existingMilestone = await db.progressMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Validate input dengan ID
    const validatedData = updateProgressMilestoneSchema.parse({ ...body, id: milestoneId });

    // Update milestone
    const updateData: any = {};
    if (validatedData.label !== undefined) updateData.label = validatedData.label;
    if (validatedData.date !== undefined) updateData.date = validatedData.date ? new Date(validatedData.date) : null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const milestone = await db.progressMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    // Transform response
    const transformedMilestone = {
      id: milestone.id,
      progressDetailId: milestone.progressDetailId,
      label: milestone.label,
      date: milestone.date?.toISOString(),
      status: milestone.status,
      order: milestone.order,
    };

    return NextResponse.json({
      success: true,
      data: transformedMilestone,
    });
  } catch (error) {
    console.error('Error updating milestone:', error);

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
          message: 'Failed to update milestone',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/progress-details/[id]/milestones/[milestoneId] - Delete milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params;

    // Check if milestone exists
    const milestone = await db.progressMilestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Delete milestone
    await db.progressMilestone.delete({
      where: { id: milestoneId },
    });

    return NextResponse.json({
      success: true,
      data: { id: milestoneId },
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);

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
          message: 'Failed to delete milestone',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






