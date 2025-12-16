import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateKprStatusSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { createActivityLog } from '@/lib/actions/activity-log-actions';
import { requireAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';
import { transitionPurchaseTransactionState } from '@/lib/actions/state-machine-actions';

// GET /api/kpr-status - Get KPR status untuk transaction
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

    // Get KPR status
    const kprStatus = await db.kprStatus.findUnique({
      where: { transactionId },
      include: {
        transaction: {
          select: {
            id: true,
            projectId: true,
            userId: true,
            unitId: true,
            state: true,
          },
        },
      },
    });

    if (!kprStatus) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'KPR status not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Transform response
    const transformedKprStatus = {
      id: kprStatus.id,
      transactionId: kprStatus.transactionId,
      status: kprStatus.status,
      bankName: kprStatus.bankName,
      submittedDate: kprStatus.submittedDate?.toISOString(),
      approvedDate: kprStatus.approvedDate?.toISOString(),
      rejectedDate: kprStatus.rejectedDate?.toISOString(),
      rejectionReason: kprStatus.rejectionReason,
      notes: kprStatus.notes,
      createdAt: kprStatus.createdAt.toISOString(),
      updatedAt: kprStatus.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedKprStatus,
    });
  } catch (error) {
    console.error('Error fetching KPR status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch KPR status',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH /api/kpr-status - Update KPR status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = updateKprStatusSchema.parse(body);

    // Check if transaction exists
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: validatedData.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Check if transaction is in KPR_PROCESS state
    if (transaction.state !== 'KPR_PROCESS' && transaction.state !== 'INTERVIEWED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction must be in KPR_PROCESS or INTERVIEWED state',
            code: 'INVALID_STATE',
          },
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: validatedData.status,
    };

    if (validatedData.bankName) updateData.bankName = validatedData.bankName;
    if (validatedData.submittedDate) updateData.submittedDate = new Date(validatedData.submittedDate);
    if (validatedData.approvedDate) updateData.approvedDate = new Date(validatedData.approvedDate);
    if (validatedData.rejectedDate) updateData.rejectedDate = new Date(validatedData.rejectedDate);
    if (validatedData.rejectionReason !== undefined) updateData.rejectionReason = validatedData.rejectionReason;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Upsert KPR status
    const kprStatus = await db.kprStatus.upsert({
      where: { transactionId: validatedData.transactionId },
      create: {
        transactionId: validatedData.transactionId,
        ...updateData,
      },
      update: updateData,
    });

    // Create activity log
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'kpr_status_updated',
      actorId: user.id,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({ status: validatedData.status, ...updateData }),
    });

    // If KPR is approved and transaction is in KPR_PROCESS, transition to UNDER_CONSTRUCTION
    if (validatedData.status === 'APPROVED' && transaction.state === 'KPR_PROCESS') {
      await transitionPurchaseTransactionState(
        validatedData.transactionId,
        'UNDER_CONSTRUCTION',
        user.id,
        getActorRole(user.role)
      );
    }

    // Transform response
    const transformedKprStatus = {
      id: kprStatus.id,
      transactionId: kprStatus.transactionId,
      status: kprStatus.status,
      bankName: kprStatus.bankName,
      submittedDate: kprStatus.submittedDate?.toISOString(),
      approvedDate: kprStatus.approvedDate?.toISOString(),
      rejectedDate: kprStatus.rejectedDate?.toISOString(),
      rejectionReason: kprStatus.rejectionReason,
      notes: kprStatus.notes,
      createdAt: kprStatus.createdAt.toISOString(),
      updatedAt: kprStatus.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedKprStatus,
    });
  } catch (error) {
    console.error('Error updating KPR status:', error);

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
          message: 'Failed to update KPR status',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

