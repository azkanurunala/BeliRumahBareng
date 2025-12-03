import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateUserSchema } from '@/lib/validations';
import { NotFoundError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
        avatarHint: true,
        role: true,
        locationPreference: true,
        priceRange: true,
        investmentGoals: true,
        financialCapacity: true,
        timeHorizon: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Transform ke format yang diharapkan frontend
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      avatarHint: user.avatarHint,
      role: user.role,
      profile: {
        locationPreference: user.locationPreference,
        priceRange: user.priceRange,
        investmentGoals: user.investmentGoals,
        financialCapacity: user.financialCapacity,
        timeHorizon: user.timeHorizon,
      },
      oauthProvider: user.oauthProvider,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedUser,
    });
  } catch (error) {
    console.error('Error fetching user:', error);

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
          message: 'Failed to fetch user',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Validate input dengan ID
    const validatedData = updateUserSchema.parse({ ...body, id });

    // Check email uniqueness jika email diubah
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Email already exists',
              code: 'CONFLICT',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update user (exclude undefined fields)
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.avatarUrl !== undefined) updateData.avatarUrl = validatedData.avatarUrl;
    if (validatedData.avatarHint !== undefined) updateData.avatarHint = validatedData.avatarHint;
    if (validatedData.passwordHash !== undefined) updateData.passwordHash = validatedData.passwordHash;
    if (validatedData.oauthProvider !== undefined) updateData.oauthProvider = validatedData.oauthProvider;
    if (validatedData.oauthId !== undefined) updateData.oauthId = validatedData.oauthId;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.locationPreference !== undefined) updateData.locationPreference = validatedData.locationPreference;
    if (validatedData.priceRange !== undefined) updateData.priceRange = validatedData.priceRange;
    if (validatedData.investmentGoals !== undefined) updateData.investmentGoals = validatedData.investmentGoals;
    if (validatedData.financialCapacity !== undefined) updateData.financialCapacity = validatedData.financialCapacity;
    if (validatedData.timeHorizon !== undefined) updateData.timeHorizon = validatedData.timeHorizon;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
        avatarHint: true,
        role: true,
        locationPreference: true,
        priceRange: true,
        investmentGoals: true,
        financialCapacity: true,
        timeHorizon: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform ke format yang diharapkan frontend
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      avatarHint: user.avatarHint,
      role: user.role,
      profile: {
        locationPreference: user.locationPreference,
        priceRange: user.priceRange,
        investmentGoals: user.investmentGoals,
        financialCapacity: user.financialCapacity,
        timeHorizon: user.timeHorizon,
      },
      oauthProvider: user.oauthProvider,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: transformedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);

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
          message: 'Failed to update user',
          code: 'UPDATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: {
        projectsAsMember: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is member of any project
    if (user.projectsAsMember.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Cannot delete user: user is a member of one or more projects',
            code: 'CONFLICT',
          },
        },
        { status: 409 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting user:', error);

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
          message: 'Failed to delete user',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

