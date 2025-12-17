import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateProgressDetailSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';
import { generateLegalProgressData } from '@/lib/legal-progress-helpers';
import { generateFundingProgressData } from '@/lib/funding-progress-helpers';

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

    // For legal and funding categories, auto-generate data
    let checklist: any[] = [];
    let completedMembers: string[] = [];
    let milestones: any[] = [];
    let percentage = progressDetail.percentage;

    if (progressDetail.category === 'legal') {
      // Generate data from document signatures (includes progress calculation)
      const legalData = await generateLegalProgressData(progressDetail.projectId);
      checklist = legalData.checklist;
      completedMembers = legalData.completedMembers;
      milestones = legalData.milestones;
      percentage = legalData.percentage;
    } else if (progressDetail.category === 'funding') {
      // Generate data from payment plans and verified payments (includes progress calculation)
      const fundingData = await generateFundingProgressData(progressDetail.projectId);
      checklist = fundingData.checklist;
      completedMembers = fundingData.completedMembers;
      milestones = fundingData.milestones;
      percentage = fundingData.percentage;
    } else {
      // Use existing data from database
      checklist = progressDetail.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
        order: item.order,
      }));
      completedMembers = progressDetail.completedMembers.map((cm) => cm.userId);
      milestones = progressDetail.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      }));
    }

    // Transform response
    const transformedProgressDetail = {
      id: progressDetail.id,
      projectId: progressDetail.projectId,
      category: progressDetail.category,
      title: progressDetail.title,
      percentage,
      description: progressDetail.description,
      notes: progressDetail.notes,
      checklist,
      completedMembers,
      milestones,
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

    // Sync percentage dengan project progress fields jika percentage di-update
    if (validatedData.percentage !== undefined) {
      try {
        const category = existingProgressDetail.category;
        const projectUpdateData: any = {};
        
        // Map category ke project progress field
        if (category === 'kyc') {
          projectUpdateData.kycProgress = validatedData.percentage;
        } else if (category === 'funding') {
          projectUpdateData.fundingProgress = validatedData.percentage;
        } else if (category === 'legal') {
          projectUpdateData.legalProgress = validatedData.percentage;
        } else if (category === 'closing') {
          projectUpdateData.closingProgress = validatedData.percentage;
        }

        // Update project progress jika ada mapping
        if (Object.keys(projectUpdateData).length > 0) {
          await db.project.update({
            where: { id: progressDetail.projectId },
            data: projectUpdateData,
          });
          
          console.log(`[Progress Sync] Updated project ${progressDetail.projectId} ${category} progress to ${validatedData.percentage}%`);
        }
      } catch (syncError) {
        // Log error tapi jangan gagalkan update progress detail
        console.error('[Progress Sync] Error syncing project progress:', syncError);
        // Continue dengan response success karena progress detail sudah ter-update
        // Client-side akan refresh dan mendapatkan data terbaru
      }
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








