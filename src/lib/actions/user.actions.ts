'use server';

import { db } from '@/lib/db';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk User Operations
 * Bisa digunakan di Client Components dengan 'use server'
 */

export async function createUser(data: z.infer<typeof createUserSchema>) {
  try {
    // Validate input
    const validatedData = createUserSchema.parse(data);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: {
          message: 'Email already exists',
          code: 'CONFLICT',
        },
      };
    }

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        avatarUrl: validatedData.avatarUrl,
        avatarHint: validatedData.avatarHint,
        passwordHash: validatedData.passwordHash,
        oauthProvider: validatedData.oauthProvider,
        oauthId: validatedData.oauthId,
        role: validatedData.role ?? 1,
        locationPreference: validatedData.locationPreference,
        priceRange: validatedData.priceRange,
        investmentGoals: validatedData.investmentGoals,
        financialCapacity: validatedData.financialCapacity,
        timeHorizon: validatedData.timeHorizon,
      },
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

    revalidatePath('/admin/users');
    revalidatePath('/api/users');

    return {
      success: true,
      data: transformedUser,
    };
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to create user',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updateUser(
  id: string,
  data: Partial<z.infer<typeof updateUserSchema>>
) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updateUserSchema.parse({ ...data, id });

    // Check email uniqueness jika email diubah
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return {
          success: false,
          error: {
            message: 'Email already exists',
            code: 'CONFLICT',
          },
        };
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

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    revalidatePath('/api/users');

    return {
      success: true,
      data: transformedUser,
    };
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          errors: error.flatten().fieldErrors,
        },
      };
    }

    return {
      success: false,
      error: {
        message: 'Failed to update user',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deleteUser(id: string) {
  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      include: {
        projectsAsMember: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if user is member of any project
    if (user.projectsAsMember.length > 0) {
      return {
        success: false,
        error: {
          message: 'Cannot delete user: user is a member of one or more projects',
          code: 'CONFLICT',
        },
      };
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    revalidatePath('/admin/users');
    revalidatePath('/api/users');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting user:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete user',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getUser(id: string) {
  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
        avatarHint: true,
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
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Transform ke format yang diharapkan frontend
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      avatarHint: user.avatarHint,
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

    return {
      success: true,
      data: transformedUser,
    };
  } catch (error) {
    console.error('Error fetching user:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch user',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getUsers(options?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const search = options?.search || '';
    const skip = (page - 1) * limit;

    // Build where clause untuk search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phoneNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get users dengan pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          avatarHint: true,
          locationPreference: true,
          priceRange: true,
          investmentGoals: true,
          financialCapacity: true,
          timeHorizon: true,
          oauthProvider: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.user.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      avatarHint: user.avatarHint,
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
    }));

    return {
      success: true,
      data: transformedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching users:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch users',
        code: 'FETCH_ERROR',
      },
    };
  }
}

