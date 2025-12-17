import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';
import { calculateKYCProgress, calculateLegalProgress, calculateClosingProgress } from '@/lib/progress-calculator';
import { updateProjectProgress } from '@/lib/actions/project.actions';

// POST /api/progress-details/[id]/checklist/[itemId]/uncomplete - Remove completion for a user from checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'userId is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Check if checklist item exists
    const checklistItem = await db.progressChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        completions: true,
      },
    });

    if (!checklistItem) {
      throw new NotFoundError('Checklist item not found');
    }

    // Check if completion exists
    const existingCompletion = checklistItem.completions.find(c => c.userId === userId);
    if (!existingCompletion) {
      // Not completed by this user, return existing data
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
    }

    // Delete completion entry
    await db.checklistItemCompletion.deleteMany({
      where: {
        checklistItemId: itemId,
        userId: userId,
      },
    });

    // Re-fetch item with updated completions
    const updatedItem = await db.progressChecklistItem.findUnique({
      where: { id: itemId },
      include: {
        completions: true,
      },
    });

    if (!updatedItem) {
      throw new NotFoundError('Failed to fetch updated item');
    }

    // Get progress detail to check category and update progress
    const progressDetail = await db.progressDetail.findUnique({
      where: { id: updatedItem.progressDetailId },
    });

    if (progressDetail) {
      // Recalculate progress
      if (progressDetail.category === 'kyc') {
        const progressValue = await calculateKYCProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { kyc: progressValue });
      } else if (progressDetail.category === 'legal') {
        const progressValue = await calculateLegalProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { legal: progressValue });
      } else if (progressDetail.category === 'closing') {
        const progressValue = await calculateClosingProgress(progressDetail.projectId);
        await updateProjectProgress(progressDetail.projectId, { closing: progressValue });
      }
    }

    // Transform response
    const transformedItem = {
      id: updatedItem.id,
      progressDetailId: updatedItem.progressDetailId,
      label: updatedItem.label,
      completedMembers: updatedItem.completions.map(c => c.userId),
      order: updatedItem.order,
    };

    return NextResponse.json({
      success: true,
      data: transformedItem,
    });
  } catch (error) {
    console.error('Error uncompleting checklist item:', error);

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
          message: 'Failed to uncomplete checklist item',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

