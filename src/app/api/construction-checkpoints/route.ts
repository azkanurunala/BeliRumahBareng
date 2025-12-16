import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  createConstructionCheckpointSchema,
  updateConstructionCheckpointSchema,
} from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { createActivityLog } from '@/lib/actions/activity-log-actions';
import { transitionPurchaseTransactionState } from '@/lib/actions/state-machine-actions';
import { requireAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';

// GET /api/construction-checkpoints - Get construction checkpoints untuk transaction
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'transactionId is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Get construction checkpoints
    const checkpoints = await db.constructionCheckpoint.findMany({
      where: { transactionId },
      orderBy: { progress: 'asc' },
    });

    // Transform ke format yang diharapkan frontend
    const transformedCheckpoints = checkpoints.map((cp) => ({
      id: cp.id,
      transactionId: cp.transactionId,
      progress: cp.progress,
      milestone: cp.milestone,
      status: cp.status,
      startDate: cp.startDate?.toISOString(),
      completedDate: cp.completedDate?.toISOString(),
      photos: cp.photos ? JSON.parse(cp.photos) : [],
      notes: cp.notes,
      createdAt: cp.createdAt.toISOString(),
      updatedAt: cp.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedCheckpoints,
    });
  } catch (error) {
    console.error('Error fetching construction checkpoints:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch construction checkpoints',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/construction-checkpoints - Create/update checkpoint (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createConstructionCheckpointSchema.parse(body);

    // Check if transaction exists
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: validatedData.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Check if transaction is in construction state
    if (
      transaction.state !== 'UNDER_CONSTRUCTION' &&
      transaction.state !== 'CASH_PROCESS' &&
      transaction.state !== 'KPR_PROCESS'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction must be in construction-related state',
            code: 'INVALID_STATE',
          },
        },
        { status: 400 }
      );
    }

    // Prepare data
    const checkpointData: any = {
      transactionId: validatedData.transactionId,
      progress: validatedData.progress,
      milestone: validatedData.milestone,
      status: validatedData.status,
    };

    if (validatedData.startDate) checkpointData.startDate = new Date(validatedData.startDate);
    if (validatedData.completedDate) checkpointData.completedDate = new Date(validatedData.completedDate);
    if (validatedData.photos) checkpointData.photos = JSON.stringify(validatedData.photos);
    if (validatedData.notes) checkpointData.notes = validatedData.notes;

    // Upsert checkpoint
    const checkpoint = await db.constructionCheckpoint.upsert({
      where: {
        transactionId_progress: {
          transactionId: validatedData.transactionId,
          progress: validatedData.progress,
        },
      },
      create: checkpointData,
      update: checkpointData,
    });

    // Create activity log
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'construction_checkpoint_updated',
      actorId: user.id,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({
        progress: validatedData.progress,
        milestone: validatedData.milestone,
        status: validatedData.status,
      }),
    });

    // If checkpoint is 100% and completed, transition to HANDOVER
    if (
      validatedData.progress === 100 &&
      validatedData.status === 'completed' &&
      transaction.state === 'UNDER_CONSTRUCTION'
    ) {
      await transitionPurchaseTransactionState(
        validatedData.transactionId,
        'HANDOVER',
        user.id,
        getActorRole(user.role)
      );
    }

    // Transform response
    const transformedCheckpoint = {
      id: checkpoint.id,
      transactionId: checkpoint.transactionId,
      progress: checkpoint.progress,
      milestone: checkpoint.milestone,
      status: checkpoint.status,
      startDate: checkpoint.startDate?.toISOString(),
      completedDate: checkpoint.completedDate?.toISOString(),
      photos: checkpoint.photos ? JSON.parse(checkpoint.photos) : [],
      notes: checkpoint.notes,
      createdAt: checkpoint.createdAt.toISOString(),
      updatedAt: checkpoint.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedCheckpoint,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating/updating construction checkpoint:', error);

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
          message: 'Failed to create/update construction checkpoint',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/construction-checkpoints - Update checkpoint status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = updateConstructionCheckpointSchema.parse(body);

    // Check if checkpoint exists
    const checkpoint = await db.constructionCheckpoint.findUnique({
      where: { id: validatedData.checkpointId },
    });

    if (!checkpoint) {
      throw new NotFoundError('Construction checkpoint not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Prepare update data
    const updateData: any = {};
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.completedDate) updateData.completedDate = new Date(validatedData.completedDate);
    if (validatedData.photos) updateData.photos = JSON.stringify(validatedData.photos);
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Update checkpoint
    const updatedCheckpoint = await db.constructionCheckpoint.update({
      where: { id: validatedData.checkpointId },
      data: updateData,
    });

    // Create activity log
    await createActivityLog({
      transactionId: checkpoint.transactionId,
      action: 'construction_checkpoint_updated',
      actorId: user.id,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({ checkpointId: validatedData.checkpointId, changes: updateData }),
    });

    // If checkpoint is 100% and completed, check if we should transition to HANDOVER
    if (updatedCheckpoint.progress === 100 && updatedCheckpoint.status === 'completed') {
      const transaction = await db.purchaseTransaction.findUnique({
        where: { id: checkpoint.transactionId },
      });

      if (transaction && transaction.state === 'UNDER_CONSTRUCTION') {
        await transitionPurchaseTransactionState(
          checkpoint.transactionId,
          'HANDOVER',
          user.id,
          getActorRole(user.role)
        );
      }
    }

    // Transform response
    const transformedCheckpoint = {
      id: updatedCheckpoint.id,
      transactionId: updatedCheckpoint.transactionId,
      progress: updatedCheckpoint.progress,
      milestone: updatedCheckpoint.milestone,
      status: updatedCheckpoint.status,
      startDate: updatedCheckpoint.startDate?.toISOString(),
      completedDate: updatedCheckpoint.completedDate?.toISOString(),
      photos: updatedCheckpoint.photos ? JSON.parse(updatedCheckpoint.photos) : [],
      notes: updatedCheckpoint.notes,
      createdAt: updatedCheckpoint.createdAt.toISOString(),
      updatedAt: updatedCheckpoint.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedCheckpoint,
    });
  } catch (error) {
    console.error('Error updating construction checkpoint:', error);

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
          message: 'Failed to update construction checkpoint',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

