import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProgressChecklistItemSchema, updateProgressChecklistItemSchema, completeProgressChecklistItemSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/progress-details/[id]/checklist - Get all checklist items for a progress detail
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

    // Get checklist items
    const checklistItems = await db.progressChecklistItem.findMany({
      where: { progressDetailId: id },
      orderBy: { order: 'asc' },
      include: {
        completer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform response
    const transformedItems = checklistItems.map((item) => ({
      id: item.id,
      progressDetailId: item.progressDetailId,
      label: item.label,
      completed: item.completed,
      completedBy: item.completedBy,
      completedAt: item.completedAt?.toISOString(),
      order: item.order,
    }));

    return NextResponse.json({
      success: true,
      data: transformedItems,
    });
  } catch (error) {
    console.error('Error fetching checklist items:', error);

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
          message: 'Failed to fetch checklist items',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/progress-details/[id]/checklist - Create new checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createProgressChecklistItemSchema.parse({ ...body, progressDetailId: id });

    // Check if progress detail exists
    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
    });

    if (!progressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Create checklist item
    const checklistItem = await db.progressChecklistItem.create({
      data: {
        progressDetailId: validatedData.progressDetailId,
        label: validatedData.label,
        order: validatedData.order,
      },
    });

    // Transform response
    const transformedItem = {
      id: checklistItem.id,
      progressDetailId: checklistItem.progressDetailId,
      label: checklistItem.label,
      completed: checklistItem.completed,
      completedBy: checklistItem.completedBy,
      completedAt: checklistItem.completedAt?.toISOString(),
      order: checklistItem.order,
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating checklist item:', error);

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
          message: 'Failed to create checklist item',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}








