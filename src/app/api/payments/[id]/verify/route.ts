import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPaymentSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// POST /api/payments/[id]/verify - Verify payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = verifyPaymentSchema.parse({ ...body, paymentId: id });

    // Check if payment exists
    const payment = await db.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check if verifier exists
    const verifier = await db.user.findUnique({
      where: { id: validatedData.verifiedBy },
    });

    if (!verifier) {
      throw new NotFoundError('Verifier not found');
    }

    // Update payment dengan verification
    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status: 'paid',
        verifiedBy: validatedData.verifiedBy,
        verifiedAt: new Date(),
        notes: validatedData.notes || payment.notes,
        paymentDate: payment.paymentDate || new Date(),
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
        verifier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedPayment = {
      id: updatedPayment.id,
      paymentPlanId: updatedPayment.paymentPlanId,
      projectId: updatedPayment.projectId,
      userId: updatedPayment.userId,
      unitId: updatedPayment.unitId,
      amount: Number(updatedPayment.amount),
      paymentDate: updatedPayment.paymentDate?.toISOString(),
      dueDate: updatedPayment.dueDate?.toISOString(),
      period: updatedPayment.period,
      status: updatedPayment.status,
      paymentMethod: updatedPayment.paymentMethod,
      receiptUrl: updatedPayment.receiptUrl,
      paymentReference: updatedPayment.paymentReference,
      notes: updatedPayment.notes,
      verifiedBy: updatedPayment.verifiedBy,
      verifiedAt: updatedPayment.verifiedAt?.toISOString(),
      createdAt: updatedPayment.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedPayment,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);

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
          message: 'Failed to verify payment',
          code: 'VERIFY_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






