import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createInterviewRecordSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { transitionPurchaseTransactionState } from '@/lib/actions/state-machine-actions';
import { createActivityLog } from '@/lib/actions/activity-log-actions';
import { requireAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';

// GET /api/interview-records - Get interview records dengan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId') || '';
    const result = searchParams.get('result') || '';

    // Build where clause
    const where: any = {};

    if (transactionId) where.transactionId = transactionId;
    if (result) where.result = result;

    // Get interview records
    const records = await db.interviewRecord.findMany({
      where,
      orderBy: { interviewDate: 'desc' },
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
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform ke format yang diharapkan frontend
    const transformedRecords = records.map((record) => ({
      id: record.id,
      transactionId: record.transactionId,
      interviewDate: record.interviewDate.toISOString(),
      interviewerId: record.interviewerId,
      result: record.result,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      interviewer: {
        id: record.interviewer.id,
        name: record.interviewer.name,
        email: record.interviewer.email,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedRecords,
    });
  } catch (error) {
    console.error('Error fetching interview records:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch interview records',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/interview-records - Record interview result (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createInterviewRecordSchema.parse(body);

    // Check if transaction exists
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: validatedData.transactionId },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    // Require admin access
    const user = await requireAdmin(request);

    // Check if transaction is in BOOKED state
    if (transaction.state !== 'BOOKED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction must be in BOOKED state to record interview',
            code: 'INVALID_STATE',
          },
        },
        { status: 400 }
      );
    }

    // Use authenticated user as interviewer
    const interviewerId = user.id;

    // Check if interview record already exists
    const existingRecord = await db.interviewRecord.findUnique({
      where: { transactionId: validatedData.transactionId },
    });

    if (existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Interview record already exists for this transaction',
            code: 'CONFLICT',
          },
        },
        { status: 409 }
      );
    }

    // Create interview record
    const record = await db.interviewRecord.create({
      data: {
        transactionId: validatedData.transactionId,
        interviewDate: new Date(validatedData.interviewDate),
        interviewerId: interviewerId,
        result: validatedData.result,
        notes: validatedData.notes,
      },
      include: {
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity log
    await createActivityLog({
      transactionId: validatedData.transactionId,
      action: 'interview_recorded',
      actorId: interviewerId,
      actorRole: getActorRole(user.role),
      details: JSON.stringify({ result: validatedData.result }),
    });

    // If result is PASSED, transition to INTERVIEWED state
    if (validatedData.result === 'PASSED') {
      await transitionPurchaseTransactionState(
        validatedData.transactionId,
        'INTERVIEWED',
        interviewerId,
        getActorRole(user.role)
      );
    }

    // Transform response
    const transformedRecord = {
      id: record.id,
      transactionId: record.transactionId,
      interviewDate: record.interviewDate.toISOString(),
      interviewerId: record.interviewerId,
      result: record.result,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      interviewer: {
        id: record.interviewer.id,
        name: record.interviewer.name,
        email: record.interviewer.email,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating interview record:', error);

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
          message: 'Failed to create interview record',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

