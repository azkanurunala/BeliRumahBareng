import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProgressDetailSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/progress-details/[id] - Get progress detail by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        checklist: {
          orderBy: { order: 'asc' },
          include: {
            completer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        completedMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!progressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Transform response
    const transformedProgressDetail = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: progressDetail.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
        order: item.order,
      })),
      completedMembers: progressDetail.completedMembers.map((cm) => cm.userId),
      milestones: progressDetail.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })),
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedProgressDetail,
    });
  } catch (error) {
    console.error('Error fetching progress detail:', error);

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
          message: 'Failed to fetch progress detail',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/progress-details/[id] - Update progress detail
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if progress detail exists
    const existingProgressDetail = await db.progressDetail.findUnique({
      where: { id },
    });

    if (!existingProgressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Validate input dengan ID
    const validatedData = updateProgressDetailSchema.parse({ ...body, id });

    // Update progress detail
    const updateData: any = {};
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.percentage !== undefined) updateData.percentage = validatedData.percentage;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes || null;

    const progressDetail = await db.progressDetail.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        checklist: {
          orderBy: { order: 'asc' },
        },
        completedMembers: true,
        milestones: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Transform response
    const transformedProgressDetail = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage: progressDetail.percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist: progressDetail.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
        order: item.order,
      })),
      completedMembers: progressDetail.completedMembers.map((cm) => cm.userId),
      milestones: progressDetail.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })),
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedProgressDetail,
    });
  } catch (error) {
    console.error('Error updating progress detail:', error);

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
          message: 'Failed to update progress detail',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/progress-details/[id] - Delete progress detail
export async function DELETE(
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

    // Delete progress detail (checklist, completedMembers, milestones will be deleted automatically due to cascade)
    await db.progressDetail.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting progress detail:', error);

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
          message: 'Failed to delete progress detail',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

