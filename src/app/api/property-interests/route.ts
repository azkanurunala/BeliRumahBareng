import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPropertyInterestSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/property-interests - Get all property interests dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const propertyId = searchParams.get('propertyId') || '';
    const userId = searchParams.get('userId') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (propertyId) where.propertyId = propertyId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // Get property interests dengan pagination
    const [interests, total] = await Promise.all([
      db.propertyInterest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.propertyInterest.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedInterests = interests.map((interest) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: transformedInterests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching property interests:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch property interests',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/property-interests - Create new property interest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPropertyInterestSchema.parse(body);

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Create property interest
    const interest = await db.propertyInterest.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: validatedData.userId,
        unitId: validatedData.unitId,
        unitSize: validatedData.unitSize,
        isFirstHome: validatedData.isFirstHome,
        willOccupy: validatedData.willOccupy,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        status: validatedData.status || 'pending',
        notes: validatedData.notes,
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

    return NextResponse.json(
      {
        success: true,
        data: transformedInterest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property interest:', error);

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
          message: 'Failed to create property interest',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

