import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { addProgressCompletedMemberSchema } from '@/lib/validations';
import { NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/progress-details/[id]/completed-members - Get all completed members for a progress detail
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

    // Get completed members
    const completedMembers = await db.progressCompletedMember.findMany({
      where: { progressDetailId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            avatarHint: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Transform response
    const transformedMembers = completedMembers.map((cm) => ({
      id: cm.id,
      progressDetailId: cm.progressDetailId,
      userId: cm.userId,
      completedAt: cm.completedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedMembers,
    });
  } catch (error) {
    console.error('Error fetching completed members:', error);

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
          message: 'Failed to fetch completed members',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/progress-details/[id]/completed-members - Add completed member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = addProgressCompletedMemberSchema.parse({ ...body, progressDetailId: id });

    // Check if progress detail exists
    const progressDetail = await db.progressDetail.findUnique({
      where: { id },
    });

    if (!progressDetail) {
      throw new NotFoundError('Progress detail not found');
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already completed
    const existing = await db.progressCompletedMember.findUnique({
      where: {
        progressDetailId_userId: {
          progressDetailId: validatedData.progressDetailId,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('User has already completed this progress');
    }

    // Create completed member
    const completedMember = await db.progressCompletedMember.create({
      data: {
        progressDetailId: validatedData.progressDetailId,
        userId: validatedData.userId,
      },
      include: {
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
    const transformedMember = {
      id: completedMember.id,
      progressDetailId: completedMember.progressDetailId,
      userId: completedMember.userId,
      completedAt: completedMember.completedAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding completed member:', error);

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
          message: 'Failed to add completed member',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/progress-details/[id]/completed-members - Remove completed member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'userId is required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Check if completed member exists
    const completedMember = await db.progressCompletedMember.findUnique({
      where: {
        progressDetailId_userId: {
          progressDetailId: id,
          userId,
        },
      },
    });

    if (!completedMember) {
      throw new NotFoundError('Completed member not found');
    }

    // Delete completed member
    await db.progressCompletedMember.delete({
      where: {
        progressDetailId_userId: {
          progressDetailId: id,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { progressDetailId: id, userId },
    });
  } catch (error) {
    console.error('Error removing completed member:', error);

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
          message: 'Failed to remove completed member',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

