import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updatePaymentSchema, verifyPaymentSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/payments/[id] - Get payment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await db.payment.findUnique({
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
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

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

    return NextResponse.json({
      success: true,
      data: transformedPayment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);

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
          message: 'Failed to fetch payment',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if payment exists
    const existingPayment = await db.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundError('Payment not found');
    }

    // Validate input dengan ID
    const validatedData = updatePaymentSchema.parse({ ...body, id });

    // Update payment
    const updateData: any = {};
    if (validatedData.paymentPlanId !== undefined) updateData.paymentPlanId = validatedData.paymentPlanId || null;
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount;
    if (validatedData.paymentDate !== undefined) updateData.paymentDate = validatedData.paymentDate ? new Date(validatedData.paymentDate) : null;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    if (validatedData.period !== undefined) updateData.period = validatedData.period || null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod || null;
    if (validatedData.receiptUrl !== undefined) updateData.receiptUrl = validatedData.receiptUrl || null;
    if (validatedData.paymentReference !== undefined) updateData.paymentReference = validatedData.paymentReference || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const payment = await db.payment.update({
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

    return NextResponse.json({
      success: true,
      data: transformedPayment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);

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
          message: 'Failed to update payment',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if payment exists
    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Delete payment
    await db.payment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting payment:', error);

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
          message: 'Failed to delete payment',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






