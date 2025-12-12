import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProgressDetailSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/progress-details - Get all progress details dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const projectId = searchParams.get('projectId') || '';
    const category = searchParams.get('category') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;

    // Get progress details dengan pagination
    const [progressDetails, total] = await Promise.all([
      db.progressDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      db.progressDetail.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedProgressDetails = progressDetails.map((pd) => ({
      id: pd.id,
      projectId: pd.projectId,
      category: pd.category,
      title: pd.title,
      percentage: pd.percentage,
      description: pd.description,
      notes: pd.notes,
      checklist: pd.checklist.map((item) => ({
        id: item.id,
        label: item.label,
        completed: item.completed,
        completedBy: item.completedBy,
        completedAt: item.completedAt?.toISOString(),
        order: item.order,
      })),
      completedMembers: pd.completedMembers.map((cm) => cm.userId),
      milestones: pd.milestones.map((m) => ({
        id: m.id,
        label: m.label,
        date: m.date?.toISOString(),
        status: m.status,
        order: m.order,
      })),
      createdAt: pd.createdAt.toISOString(),
      updatedAt: pd.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedProgressDetails,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching progress details:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch progress details',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/progress-details - Create new progress detail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createProgressDetailSchema.parse(body);

    // Check if project exists
    const project = await db.project.findUnique({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if progress detail with same category already exists
    const existing = await db.progressDetail.findUnique({
      where: {
        projectId_category: {
          projectId: validatedData.projectId,
          category: validatedData.category,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Progress detail with category '${validatedData.category}' already exists for this project`);
    }

    // Create progress detail
    const progressDetail = await db.progressDetail.create({
      data: {
        projectId: validatedData.projectId,
        category: validatedData.category,
        title: validatedData.title,
        percentage: validatedData.percentage,
        description: validatedData.description || null,
        notes: validatedData.notes || null,
      },
      include: {
        project: {
          select: {
            id: true,
            propertyName: true,
          },
        },
        checklist: true,
        completedMembers: true,
        milestones: true,
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
      checklist: [],
      completedMembers: [],
      milestones: [],
      createdAt: progressDetail.createdAt.toISOString(),
      updatedAt: progressDetail.updatedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedProgressDetail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating progress detail:', error);

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

    if (error instanceof NotFoundError || error instanceof ConflictError) {
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
          message: 'Failed to create progress detail',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






