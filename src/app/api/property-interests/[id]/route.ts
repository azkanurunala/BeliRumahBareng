import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updatePropertyInterestSchema, reviewPropertyInterestSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/property-interests/[id] - Get property interest by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interest = await db.propertyInterest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
    });

    if (!interest) {
      throw new NotFoundError('Property interest not found');
    }

    // Transform response
    const transformedInterest = {
      id: interest.id,
      propertyId: interest.propertyId,
      userId: interest.userId,
      unitId: interest.unitId,
      unitSize: interest.unitSize ? Number(interest.unitSize) : undefined,
      isFirstHome: interest.isFirstHome,
      willOccupy: interest.willOccupy,
      email: interest.email,
      phoneNumber: interest.phoneNumber,
      status: interest.status as 'pending' | 'approved' | 'rejected' | undefined,
      notes: interest.notes,
      reviewedAt: interest.reviewedAt?.toISOString(),
      createdAt: interest.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedInterest,
    });
  } catch (error) {
    console.error('Error fetching property interest:', error);

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
          message: 'Failed to fetch property interest',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/property-interests/[id] - Update property interest
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if interest exists
    const existingInterest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!existingInterest) {
      throw new NotFoundError('Property interest not found');
    }

    // Validate input dengan ID
    const validatedData = updatePropertyInterestSchema.parse({ ...body, id });

    // Update interest
    const updateData: any = {};
    if (validatedData.propertyId !== undefined) updateData.propertyId = validatedData.propertyId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
    if (validatedData.isFirstHome !== undefined) updateData.isFirstHome = validatedData.isFirstHome;
    if (validatedData.willOccupy !== undefined) updateData.willOccupy = validatedData.willOccupy;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const interest = await db.propertyInterest.update({
      where: { id },
      data: updateData,
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
      id: interest.id,
      propertyId: interest.propertyId,
      userId: interest.userId,
      unitId: interest.unitId,
      unitSize: interest.unitSize ? Number(interest.unitSize) : undefined,
      isFirstHome: interest.isFirstHome,
      willOccupy: interest.willOccupy,
      email: interest.email,
      phoneNumber: interest.phoneNumber,
      status: interest.status as 'pending' | 'approved' | 'rejected' | undefined,
      notes: interest.notes,
      reviewedAt: interest.reviewedAt?.toISOString(),
      createdAt: interest.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedInterest,
    });
  } catch (error) {
    console.error('Error updating property interest:', error);

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
          message: 'Failed to update property interest',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/property-interests/[id] - Delete property interest
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if interest exists
    const interest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!interest) {
      throw new NotFoundError('Property interest not found');
    }

    // Delete interest
    await db.propertyInterest.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting property interest:', error);

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
          message: 'Failed to delete property interest',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






