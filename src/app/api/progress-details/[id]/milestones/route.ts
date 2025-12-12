import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProgressMilestoneSchema, updateProgressMilestoneSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/progress-details/[id]/milestones - Get all milestones for a progress detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if progress detail exists
    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
    });

    if (!progressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Get milestones
    const milestones = await db.progressMilestone.findMany({
      where: { progressDetailId: id },
      orderBy: { order: 'asc' },
    });

    // Transform response
    const transformedMilestones = milestones.map((m) => ({
      id: m.id,
      progressDetailId: m.progressDetailId,
      label: m.label,
      date: m.date?.toISOString(),
      status: m.status,
      order: m.order,
    }));

    return NextResponse.json({
      success: true,
      data: transformedMilestones,
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);

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
          message: 'Failed to fetch milestones',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/progress-details/[id]/milestones - Create new milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createProgressMilestoneSchema.parse({ ...body, progressDetailId: id });

    // Check if progress detail exists
    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
    });

    if (!progressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Create milestone
    const milestone = await db.progressMilestone.create({
      data: {
        progressDetailId: validatedData.progressDetailId,
        label: validatedData.label,
        date: validatedData.date ? new Date(validatedData.date) : null,
        status: validatedData.status,
        order: validatedData.order,
      },
    });

    // Transform response
    const transformedMilestone = {
      id: milestone.id,
      progressDetailId: milestone.progressDetailId,
      label: milestone.label,
      date: milestone.date?.toISOString(),
      status: milestone.status,
      order: milestone.order,
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedMilestone,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating milestone:', error);

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
          message: 'Failed to create milestone',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






