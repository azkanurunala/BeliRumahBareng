import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookingFeePaymentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { lockUnit } from '@/lib/actions/unit-lock-actions';
import { transitionPurchaseTransactionState } from '@/lib/actions/state-machine-actions';
import { createActivityLog } from '@/lib/actions/activity-log-actions';
import { requireOwnerOrAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';

// GET /api/payments/booking-fee - Get booking fee status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    const unitId = searchParams.get('unitId');

    // Build where clause
    const where: any = {};

    if (transactionId) {
      where.id = transactionId;
    } else if (projectId && userId && unitId) {
      where.projectId = projectId;
      where.userId = userId;
      where.unitId = parseInt(unitId);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Either transactionId or (projectId, userId, unitId) is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await db.purchaseTransaction.findFirst({
      where,
      select: {
        id: true,
        projectId: true,
        userId: true,
        unitId: true,
        state: true,
        bookingFeeAmount: true,
        bookingDate: true,
        paymentProofUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      );
    }

    // Transform response
    const transformedTransaction = {
      id: transaction.id,
      projectId: transaction.projectId,
      userId: transaction.userId,
      unitId: transaction.unitId,
      state: transaction.state,
      bookingFeeAmount: transaction.bookingFeeAmount ? Number(transaction.bookingFeeAmount) : null,
      bookingDate: transaction.bookingDate?.toISOString(),
      paymentProofUrl: transaction.paymentProofUrl,
      isPaid: !!transaction.bookingFeeAmount && !!transaction.paymentProofUrl,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedTransaction,
    });
  } catch (error) {
    console.error('Error fetching booking fee status:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch booking fee status',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/payments/booking-fee - Create booking fee payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = bookingFeePaymentSchema.parse(body);

    // Check if transaction exists
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: validatedData.transactionId },
      include: {
        project: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Verify user owns the transaction or is admin
    const user = await requireOwnerOrAdmin(request, transaction.userId);

    // Check if transaction is in DRAFT state
    if (transaction.state !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction must be in DRAFT state to pay booking fee',
            code: 'INVALID_STATE',
          },
        },
        { status: 400 }
      );
    }

    // Check if booking fee already paid
    if (transaction.bookingFeeAmount && transaction.paymentProofUrl) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Booking fee already paid',
            code: 'CONFLICT',
          },
        },
        { status: 409 }
      );
    }

    // Lock unit
    const lockResult = await lockUnit(
      transaction.projectId,
      transaction.unitId,
      validatedData.transactionId
    );

    if (!lockResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: lockResult.error || 'Failed to lock unit',
            code: 'LOCK_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Update transaction with booking fee payment
    const updatedTransaction = await db.purchaseTransaction.update({
      where: { id: validatedData.transactionId },
      data: {
        bookingFeeAmount: validatedData.bookingFeeAmount,
        bookingDate: new Date(validatedData.bookingDate),
        paymentProofUrl: validatedData.paymentProofUrl,
      },
    });

    // Create activity log
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'payment',
      actorId: transaction.userId, // Customer pays booking fee
      actorRole: 'customer',
      details: JSON.stringify({
        type: 'booking_fee',
        amount: validatedData.bookingFeeAmount,
        paymentProofUrl: validatedData.paymentProofUrl,
      }),
    });

    // Transition to BOOKED state
    await transitionPurchaseTransactionState(
      validatedData.transactionId,
      'BOOKED',
      transaction.userId,
      'customer'
    );

    // Create activity log for unit lock
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'unit_locked',
      actorId: transaction.userId,
      actorRole: 'customer',
      details: JSON.stringify({
        projectId: transaction.projectId,
        unitId: transaction.unitId,
      }),
    });

    // Transform response
    const transformedTransaction = {
      id: updatedTransaction.id,
      projectId: updatedTransaction.projectId,
      userId: updatedTransaction.userId,
      unitId: updatedTransaction.unitId,
      state: updatedTransaction.state,
      bookingFeeAmount: Number(updatedTransaction.bookingFeeAmount),
      bookingDate: updatedTransaction.bookingDate?.toISOString(),
      paymentProofUrl: updatedTransaction.paymentProofUrl,
      createdAt: updatedTransaction.createdAt.toISOString(),
      updatedAt: updatedTransaction.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing booking fee payment:', error);

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
          message: 'Failed to process booking fee payment',
          code: 'PAYMENT_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

