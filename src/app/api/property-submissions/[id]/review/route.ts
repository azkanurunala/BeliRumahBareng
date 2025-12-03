import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviewPropertySubmissionSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// POST /api/property-submissions/[id]/review - Review property submission (approve/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = reviewPropertySubmissionSchema.parse({ ...body, id });

    // Check if submission exists
    const submission = await db.propertySubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundError('Property submission not found');
    }

    // Check if reviewer exists
    const reviewer = await db.user.findUnique({
      where: { id: validatedData.reviewedBy },
    });

    if (!reviewer) {
      throw new NotFoundError('Reviewer not found');
    }

    // Update submission dengan review
    const updatedSubmission = await db.propertySubmission.update({
      where: { id },
      data: {
        status: validatedData.status,
        reviewedBy: validatedData.reviewedBy,
        notes: validatedData.notes || submission.notes,
        reviewedAt: new Date(),
      },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Transform response
    const transformedSubmission = {
      id: updatedSubmission.id,
      submittedBy: updatedSubmission.submittedBy,
      type: updatedSubmission.type as 'co-building' | 'co-owning',
      name: updatedSubmission.name,
      description: updatedSubmission.description,
      location: updatedSubmission.location,
      totalArea: updatedSubmission.totalArea ? Number(updatedSubmission.totalArea) : undefined,
      totalUnits: updatedSubmission.totalUnits,
      unitSize: updatedSubmission.unitSize ? Number(updatedSubmission.unitSize) : undefined,
      unitMeasure: updatedSubmission.unitMeasure,
      askingPrice: Number(updatedSubmission.askingPrice),
      contactPerson: updatedSubmission.contactPerson,
      contactPhone: updatedSubmission.contactPhone,
      contactEmail: updatedSubmission.contactEmail,
      images: updatedSubmission.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      status: updatedSubmission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: updatedSubmission.reviewedBy,
      reviewedAt: updatedSubmission.reviewedAt?.toISOString(),
      notes: updatedSubmission.notes,
      createdAt: updatedSubmission.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedSubmission,
    });
  } catch (error) {
    console.error('Error reviewing property submission:', error);

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
          message: 'Failed to review property submission',
          code: 'REVIEW_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

