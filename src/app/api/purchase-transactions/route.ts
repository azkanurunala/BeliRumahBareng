import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  createPurchaseTransactionSchema,
  updatePurchaseTransactionStateSchema,
} from '@/lib/validations';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors';
import { z } from 'zod';
import { transitionPurchaseTransactionState } from '@/lib/actions/state-machine-actions';
import { getCurrentUser, requireAdmin, requireOwnerOrAdmin } from '@/lib/auth-helpers';
import { getActorRole } from '@/lib/auth-utils';

// GET /api/purchase-transactions - Get all purchase transactions dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId') || '';
    const userId = searchParams.get('userId') || '';
    const state = searchParams.get('state') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (state) where.state = state;

    // Get transactions dengan pagination
    const [transactions, total] = await Promise.all([
      db.purchaseTransaction.findMany({
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
              phoneNumber: true,
            },
          },
          interviewRecord: {
            include: {
              interviewer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          appointments: {
            orderBy: { scheduledDate: 'asc' },
          },
          kprStatus: true,
          constructionCheckpoints: {
            orderBy: { progress: 'asc' },
          },
          activityLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Latest 10 activity logs
          },
        },
      }),
      db.purchaseTransaction.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedTransactions = transactions.map((tx) => ({
      id: tx.id,
      projectId: tx.projectId,
      userId: tx.userId,
      unitId: tx.unitId,
      state: tx.state,
      paymentType: tx.paymentType as 'cash' | 'kpr' | undefined,
      bookingFeeAmount: tx.bookingFeeAmount ? Number(tx.bookingFeeAmount) : undefined,
      bookingDate: tx.bookingDate?.toISOString(),
      paymentProofUrl: tx.paymentProofUrl,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
      interviewRecord: tx.interviewRecord
        ? {
            id: tx.interviewRecord.id,
            transactionId: tx.interviewRecord.transactionId,
            interviewDate: tx.interviewRecord.interviewDate.toISOString(),
            interviewerId: tx.interviewRecord.interviewerId,
            result: tx.interviewRecord.result,
            notes: tx.interviewRecord.notes,
            createdAt: tx.interviewRecord.createdAt.toISOString(),
            updatedAt: tx.interviewRecord.updatedAt.toISOString(),
          }
        : undefined,
      appointments: tx.appointments.map((apt) => ({
        id: apt.id,
        transactionId: apt.transactionId,
        type: apt.type,
        scheduledDate: apt.scheduledDate.toISOString(),
        status: apt.status,
        location: apt.location,
        notes: apt.notes,
        completedAt: apt.completedAt?.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        updatedAt: apt.updatedAt.toISOString(),
      })),
      kprStatus: tx.kprStatus
        ? {
            id: tx.kprStatus.id,
            transactionId: tx.kprStatus.transactionId,
            status: tx.kprStatus.status,
            bankName: tx.kprStatus.bankName,
            submittedDate: tx.kprStatus.submittedDate?.toISOString(),
            approvedDate: tx.kprStatus.approvedDate?.toISOString(),
            rejectedDate: tx.kprStatus.rejectedDate?.toISOString(),
            rejectionReason: tx.kprStatus.rejectionReason,
            notes: tx.kprStatus.notes,
            createdAt: tx.kprStatus.createdAt.toISOString(),
            updatedAt: tx.kprStatus.updatedAt.toISOString(),
          }
        : undefined,
      constructionCheckpoints: tx.constructionCheckpoints.map((cp) => ({
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
      })),
      activityLogs: tx.activityLogs.map((log) => ({
        id: log.id,
        transactionId: log.transactionId,
        action: log.action,
        actorId: log.actorId,
        actorRole: log.actorRole,
        fromState: log.fromState,
        toState: log.toState,
        details: log.details,
        createdAt: log.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch purchase transactions',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/purchase-transactions - Create new purchase transaction atau transition state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a state transition request
    if (body.transactionId && body.toState) {
      const validatedData = updatePurchaseTransactionStateSchema.parse(body);

      // Get current user and verify authorization
      const user = await getCurrentUser(request);
      
      // Get transaction to check ownership
      const transaction = await db.purchaseTransaction.findUnique({
        where: { id: validatedData.transactionId },
        select: { userId: true, state: true },
      });

      if (!transaction) {
        throw new NotFoundError('Transaction not found');
      }

      // Only admin can transition states (except DRAFT → BOOKED which is done via booking fee payment)
      // This endpoint is for admin state transitions
      if (transaction.state !== 'DRAFT') {
        await requireAdmin(request);
      } else {
        // For DRAFT state, user must own the transaction
        await requireOwnerOrAdmin(request, transaction.userId);
      }

      const actorRole = getActorRole(user.role);

      const result = await transitionPurchaseTransactionState(
        validatedData.transactionId,
        validatedData.toState,
        user.id,
        actorRole,
        validatedData.paymentType,
        validatedData.notes
      );

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: result.error || 'Failed to transition state',
              code: 'TRANSITION_ERROR',
            },
          },
          { status: 400 }
        );
      }

      // Fetch updated transaction
      const updatedTransaction = await db.purchaseTransaction.findUnique({
        where: { id: validatedData.transactionId },
        include: {
          interviewRecord: true,
          appointments: true,
          kprStatus: true,
          constructionCheckpoints: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: updatedTransaction,
        },
        { status: 200 }
      );
    }

    // Otherwise, create new transaction
    const validatedData = createPurchaseTransactionSchema.parse(body);

    // Get current user and verify authorization
    const currentUser = await getCurrentUser(request);
    
    // User can only create transaction for themselves (unless admin)
    if (currentUser.role !== 2 && currentUser.id !== validatedData.userId) {
      throw new ForbiddenError('You can only create transactions for yourself');
    }

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

    // Check if transaction already exists
    const existingTransaction = await db.purchaseTransaction.findFirst({
      where: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Transaction already exists for this project, user, and unit',
            code: 'CONFLICT',
          },
        },
        { status: 409 }
      );
    }

    // Create transaction
    const transaction = await db.purchaseTransaction.create({
      data: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        state: validatedData.state,
        paymentType: validatedData.paymentType,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: transaction.id,
          projectId: transaction.projectId,
          userId: transaction.userId,
          unitId: transaction.unitId,
          state: transaction.state,
          paymentType: transaction.paymentType,
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating/transitioning purchase transaction:', error);

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
          message: 'Failed to create/transition purchase transaction',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

