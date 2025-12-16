import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updatePaymentPlanSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/payment-plans/[id] - Get payment plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id },
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
    });

    if (!paymentPlan) {
      throw new NotFoundError('Payment plan not found');
    }

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
      payments: paymentPlan.payments.map((p) => ({
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
    };

    return NextResponse.json({
      success: true,
      data: transformedPlan,
    });
  } catch (error) {
    console.error('Error fetching payment plan:', error);

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
          message: 'Failed to fetch payment plan',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/payment-plans/[id] - Update payment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if payment plan exists
    const existingPlan = await db.paymentPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      throw new NotFoundError('Payment plan not found');
    }

    // Validate input dengan ID
    const validatedData = updatePaymentPlanSchema.parse({ ...body, id });

    // Update payment plan
    const updateData: any = {};
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.totalAmount !== undefined) updateData.totalAmount = validatedData.totalAmount;
    if (validatedData.downPayment !== undefined) updateData.downPayment = validatedData.downPayment;
    if (validatedData.installmentAmount !== undefined) updateData.installmentAmount = validatedData.installmentAmount;
    if (validatedData.totalInstallments !== undefined) updateData.totalInstallments = validatedData.totalInstallments;
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    const paymentPlan = await db.paymentPlan.update({
      where: { id },
      data: updateData,
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
        payments: {
          orderBy: { createdAt: 'desc' },
        },
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
      payments: paymentPlan.payments.map((p) => ({
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
    };

    return NextResponse.json({
      success: true,
      data: transformedPlan,
    });
  } catch (error) {
    console.error('Error updating payment plan:', error);

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
          message: 'Failed to update payment plan',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/payment-plans/[id] - Delete payment plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if payment plan exists
    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!paymentPlan) {
      throw new NotFoundError('Payment plan not found');
    }

    // Check if there are payments (optional: bisa dihapus atau tidak)
    // Untuk sekarang, kita allow delete meskipun ada payments
    // karena cascade akan handle

    // Delete payment plan (payments will be handled by cascade or manually)
    await db.paymentPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting payment plan:', error);

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
          message: 'Failed to delete payment plan',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








