import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPropertySubmissionSchema } from '@/lib/validations';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/property-submissions - Get all property submissions dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const submittedBy = searchParams.get('submittedBy') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (submittedBy) where.submittedBy = submittedBy;
    if (status) where.status = status;
    if (type) where.type = type;

    // Get property submissions dengan pagination
    const [submissions, total] = await Promise.all([
      db.propertySubmission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.propertySubmission.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedSubmissions = submissions.map((submission) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: transformedSubmissions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching property submissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch property submissions',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/property-submissions - Create new property submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPropertySubmissionSchema.parse(body);

    // Check if submitter exists
    const submitter = await db.user.findUnique({
      where: { id: validatedData.submittedBy },
    });

    if (!submitter) {
      throw new NotFoundError('Submitter not found');
    }

    // Create property submission dengan images
    const submission = await db.propertySubmission.create({
      data: {
        submittedBy: validatedData.submittedBy,
        type: validatedData.type,
        name: validatedData.name,
        description: validatedData.description,
        location: validatedData.location,
        totalArea: validatedData.totalArea,
        totalUnits: validatedData.totalUnits,
        unitSize: validatedData.unitSize,
        unitMeasure: validatedData.unitMeasure,
        askingPrice: validatedData.askingPrice,
        contactPerson: validatedData.contactPerson,
        contactPhone: validatedData.contactPhone,
        contactEmail: validatedData.contactEmail,
        status: 'pending',
        images: {
          create: validatedData.images?.map((img, index) => ({
            url: img.url,
            hint: img.hint,
            order: img.order ?? index,
          })) || [],
        },
      },
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

    return NextResponse.json(
      {
        success: true,
        data: transformedSubmission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property submission:', error);

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
          message: 'Failed to create property submission',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








