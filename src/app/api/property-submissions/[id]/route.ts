import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updatePropertySubmissionSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/property-submissions/[id] - Get property submission by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const submission = await db.propertySubmission.findUnique({
      where: { id },
      include: {
        submitter: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            avatarHint: true,
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

    if (!submission) {
      throw new NotFoundError('Property submission not found');
    }

    // Transform response
    const transformedSubmission = {
      id: submission.id,
      submittedBy: submission.submittedBy,
      type: submission.type as 'co-building' | 'co-owning',
      name: submission.name,
      description: submission.description,
      location: submission.location,
      totalArea: submission.totalArea ? Number(submission.totalArea) : undefined,
      totalUnits: submission.totalUnits,
      unitSize: submission.unitSize ? Number(submission.unitSize) : undefined,
      unitMeasure: submission.unitMeasure,
      askingPrice: Number(submission.askingPrice),
      contactPerson: submission.contactPerson,
      contactPhone: submission.contactPhone,
      contactEmail: submission.contactEmail,
      images: submission.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      status: submission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt?.toISOString(),
      notes: submission.notes,
      createdAt: submission.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedSubmission,
    });
  } catch (error) {
    console.error('Error fetching property submission:', error);

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
          message: 'Failed to fetch property submission',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/property-submissions/[id] - Update property submission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if submission exists
    const existingSubmission = await db.propertySubmission.findUnique({
      where: { id },
    });

    if (!existingSubmission) {
      throw new NotFoundError('Property submission not found');
    }

    // Validate input dengan ID
    const validatedData = updatePropertySubmissionSchema.parse({ ...body, id });

    // Update submission
    const updateData: any = {};
    if (validatedData.submittedBy !== undefined) updateData.submittedBy = validatedData.submittedBy;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.totalArea !== undefined) updateData.totalArea = validatedData.totalArea;
    if (validatedData.totalUnits !== undefined) updateData.totalUnits = validatedData.totalUnits;
    if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
    if (validatedData.unitMeasure !== undefined) updateData.unitMeasure = validatedData.unitMeasure;
    if (validatedData.askingPrice !== undefined) updateData.askingPrice = validatedData.askingPrice;
    if (validatedData.contactPerson !== undefined) updateData.contactPerson = validatedData.contactPerson;
    if (validatedData.contactPhone !== undefined) updateData.contactPhone = validatedData.contactPhone;
    if (validatedData.contactEmail !== undefined) updateData.contactEmail = validatedData.contactEmail;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Handle images update
    if (validatedData.images !== undefined) {
      // Delete existing images
      await db.propertySubmissionImage.deleteMany({
        where: { propertySubmissionId: id },
      });

      // Create new images
      updateData.images = {
        create: validatedData.images.map((img, index) => ({
          url: img.url,
          hint: img.hint,
          order: img.order ?? index,
        })),
      };
    }

    const submission = await db.propertySubmission.update({
      where: { id },
      data: updateData,
      include: {
        submitter: {
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
      id: submission.id,
      submittedBy: submission.submittedBy,
      type: submission.type as 'co-building' | 'co-owning',
      name: submission.name,
      description: submission.description,
      location: submission.location,
      totalArea: submission.totalArea ? Number(submission.totalArea) : undefined,
      totalUnits: submission.totalUnits,
      unitSize: submission.unitSize ? Number(submission.unitSize) : undefined,
      unitMeasure: submission.unitMeasure,
      askingPrice: Number(submission.askingPrice),
      contactPerson: submission.contactPerson,
      contactPhone: submission.contactPhone,
      contactEmail: submission.contactEmail,
      images: submission.images.map((img) => ({
        url: img.url,
        hint: img.hint,
      })),
      status: submission.status as 'pending' | 'approved' | 'rejected',
      reviewedBy: submission.reviewedBy,
      reviewedAt: submission.reviewedAt?.toISOString(),
      notes: submission.notes,
      createdAt: submission.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedSubmission,
    });
  } catch (error) {
    console.error('Error updating property submission:', error);

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
          message: 'Failed to update property submission',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/property-submissions/[id] - Delete property submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if submission exists
    const submission = await db.propertySubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundError('Property submission not found');
    }

    // Delete submission (images will be deleted automatically due to cascade)
    await db.propertySubmission.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting property submission:', error);

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
          message: 'Failed to delete property submission',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

