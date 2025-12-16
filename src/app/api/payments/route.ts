import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPaymentSchema, updatePaymentSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/payments - Get all payments dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId') || '';
    const userId = searchParams.get('userId') || '';
    const paymentPlanId = searchParams.get('paymentPlanId') || '';
    const status = searchParams.get('status') || '';
    const period = searchParams.get('period') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (paymentPlanId) where.paymentPlanId = paymentPlanId;
    if (status) where.status = status;
    if (period) where.period = period;

    // Get payments dengan pagination
    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
              avatarUrl: true,
              avatarHint: true,
            },
          },
          paymentPlan: {
            select: {
              id: true,
              type: true,
              totalAmount: true,
            },
          },
          verifier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedPayments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch payments',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPaymentSchema.parse(body);

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

    // Check if payment plan exists (if provided)
    if (validatedData.paymentPlanId) {
      const paymentPlan = await db.paymentPlan.findUnique({
        where: { id: validatedData.paymentPlanId },
      });

      if (!paymentPlan) {
        throw new NotFoundError('Payment plan not found');
      }
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        paymentPlanId: validatedData.paymentPlanId || null,
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : null,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        period: validatedData.period || null,
        status: validatedData.status,
        paymentMethod: validatedData.paymentMethod || null,
        receiptUrl: validatedData.receiptUrl || null,
        paymentReference: validatedData.paymentReference || null,
        notes: validatedData.notes || null,
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
          },
        },
        paymentPlan: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    // Transform response
    const transformedPayment = {
      id: payment.id,
      paymentPlanId: payment.paymentPlanId,
      projectId: payment.projectId,
      userId: payment.userId,
      unitId: payment.unitId,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate?.toISOString(),
      dueDate: payment.dueDate?.toISOString(),
      period: payment.period,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      receiptUrl: payment.receiptUrl,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedPayment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment:', error);

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
          message: 'Failed to create payment',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








