import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPaymentPlanSchema, updatePaymentPlanSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/payment-plans - Get all payment plans dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId') || '';
    const userId = searchParams.get('userId') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;

    // Get payment plans dengan pagination
    const [paymentPlans, total] = await Promise.all([
      db.paymentPlan.findMany({
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
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.paymentPlan.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedPlans = paymentPlans.map((plan) => ({
      id: plan.id,
      projectId: plan.projectId,
      userId: plan.userId,
      unitId: plan.unitId,
      totalAmount: Number(plan.totalAmount),
      downPayment: plan.downPayment ? Number(plan.downPayment) : undefined,
      installmentAmount: plan.installmentAmount ? Number(plan.installmentAmount) : undefined,
      totalInstallments: plan.totalInstallments,
      startDate: plan.startDate?.toISOString(),
      endDate: plan.endDate?.toISOString(),
      status: plan.status,
      type: plan.type,
      payments: plan.payments.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        userId: p.userId,
        unitId: p.unitId,
        amount: Number(p.amount),
        paymentDate: p.paymentDate?.toISOString(),
        dueDate: p.dueDate?.toISOString(),
        period: p.period,
        status: p.status,
        paymentMethod: p.paymentMethod,
        receiptUrl: p.receiptUrl,
        paymentReference: p.paymentReference,
        notes: p.notes,
        verifiedBy: p.verifiedBy,
        verifiedAt: p.verifiedAt?.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlans,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payment plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch payment plans',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/payment-plans - Create new payment plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPaymentPlanSchema.parse(body);

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

    // Create payment plan
    const paymentPlan = await db.paymentPlan.create({
      data: {
        projectId: validatedData.projectId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        type: validatedData.type,
        totalAmount: validatedData.totalAmount,
        downPayment: validatedData.downPayment,
        installmentAmount: validatedData.installmentAmount,
        totalInstallments: validatedData.totalInstallments,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status,
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
        payments: true,
      },
    });

    // Transform response
    const transformedPlan = {
      id: paymentPlan.id,
      projectId: paymentPlan.projectId,
      userId: paymentPlan.userId,
      unitId: paymentPlan.unitId,
      totalAmount: Number(paymentPlan.totalAmount),
      downPayment: paymentPlan.downPayment ? Number(paymentPlan.downPayment) : undefined,
      installmentAmount: paymentPlan.installmentAmount ? Number(paymentPlan.installmentAmount) : undefined,
      totalInstallments: paymentPlan.totalInstallments,
      startDate: paymentPlan.startDate?.toISOString(),
      endDate: paymentPlan.endDate?.toISOString(),
      status: paymentPlan.status,
      type: paymentPlan.type,
      payments: [],
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedPlan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating payment plan:', error);

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
          message: 'Failed to create payment plan',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






