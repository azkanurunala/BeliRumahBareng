import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviewPropertyInterestSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// POST /api/property-interests/[id]/review - Review property interest (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = reviewPropertyInterestSchema.parse({ ...body, id });

    // Check if interest exists
    const interest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundError('Property interest not found');
    }

    // Check if reviewer exists
    const reviewer = await db.user.findUnique({
      where: { id: validatedData.reviewedBy },
    });

    if (!reviewer) {
      throw new NotFoundError('Reviewer not found');
    }

    // Update interest dengan review
    const updatedInterest = await db.propertyInterest.update({
      where: { id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes || interest.notes,
        reviewedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedInterest = {
      id: updatedInterest.id,
      propertyId: updatedInterest.propertyId,
      userId: updatedInterest.userId,
      unitId: updatedInterest.unitId,
      unitSize: updatedInterest.unitSize ? Number(updatedInterest.unitSize) : undefined,
      isFirstHome: updatedInterest.isFirstHome,
      willOccupy: updatedInterest.willOccupy,
      email: updatedInterest.email,
      phoneNumber: updatedInterest.phoneNumber,
      status: updatedInterest.status as 'pending' | 'approved' | 'rejected' | undefined,
      notes: updatedInterest.notes,
      reviewedAt: updatedInterest.reviewedAt?.toISOString(),
      createdAt: updatedInterest.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedInterest,
    });
  } catch (error) {
    console.error('Error reviewing property interest:', error);

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
          message: 'Failed to review property interest',
          code: 'REVIEW_ERROR',
        },
      },
      { status: 500 }
    );
  }
}



