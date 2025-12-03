'use server';

import { db } from '@/lib/db';
import { createPropertyInterestSchema, updatePropertyInterestSchema, reviewPropertyInterestSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Property Interest Operations
 */

export async function createPropertyInterest(data: z.infer<typeof createPropertyInterestSchema>) {
  try {
    // Validate input
    const validatedData = createPropertyInterestSchema.parse(data);

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      return {
        success: false,
        error: {
          message: 'Property not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
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

    revalidatePath('/admin/properties');
    revalidatePath(`/property/${validatedData.propertyId}`);
    revalidatePath('/api/property-interests');

    return {
      success: true,
      data: transformedInterest,
    };
  } catch (error) {
    console.error('Error creating property interest:', error);

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
        message: 'Failed to create property interest',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function updatePropertyInterest(
  id: string,
  data: Partial<z.infer<typeof updatePropertyInterestSchema>>
) {
  try {
    // Check if interest exists
    const existingInterest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!existingInterest) {
      return {
        success: false,
        error: {
          message: 'Property interest not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Validate input dengan ID
    const validatedData = updatePropertyInterestSchema.parse({ ...data, id });

    // Update interest
    const updateData: any = {};
    if (validatedData.propertyId !== undefined) updateData.propertyId = validatedData.propertyId;
    if (validatedData.userId !== undefined) updateData.userId = validatedData.userId;
    if (validatedData.unitId !== undefined) updateData.unitId = validatedData.unitId;
    if (validatedData.unitSize !== undefined) updateData.unitSize = validatedData.unitSize;
    if (validatedData.isFirstHome !== undefined) updateData.isFirstHome = validatedData.isFirstHome;
    if (validatedData.willOccupy !== undefined) updateData.willOccupy = validatedData.willOccupy;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const interest = await db.propertyInterest.update({
      where: { id },
      data: updateData,
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

    revalidatePath('/admin/properties');
    revalidatePath(`/property/${interest.propertyId}`);
    revalidatePath('/api/property-interests');

    return {
      success: true,
      data: transformedInterest,
    };
  } catch (error) {
    console.error('Error updating property interest:', error);

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
        message: 'Failed to update property interest',
        code: 'UPDATE_ERROR',
      },
    };
  }
}

export async function deletePropertyInterest(id: string) {
  try {
    // Check if interest exists
    const interest = await db.propertyInterest.findUnique({
      where: { id },
    });

    if (!interest) {
      return {
        success: false,
        error: {
          message: 'Property interest not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete interest
    await db.propertyInterest.delete({
      where: { id },
    });

    revalidatePath('/admin/properties');
    revalidatePath(`/property/${interest.propertyId}`);
    revalidatePath('/api/property-interests');

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error deleting property interest:', error);

    return {
      success: false,
      error: {
        message: 'Failed to delete property interest',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getPropertyInterest(id: string) {
  try {
    const interest = await db.propertyInterest.findUnique({
      where: { id },
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
    });

    if (!interest) {
      return {
        success: false,
        error: {
          message: 'Property interest not found',
          code: 'NOT_FOUND',
        },
      };
    }

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

    return {
      success: true,
      data: transformedInterest,
    };
  } catch (error) {
    console.error('Error fetching property interest:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch property interest',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function getPropertyInterests(options?: {
  page?: number;
  limit?: number;
  propertyId?: string;
  userId?: string;
  status?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.propertyId) where.propertyId = options.propertyId;
    if (options?.userId) where.userId = options.userId;
    if (options?.status) where.status = options.status;

    // Get interests dengan pagination
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

    // Transform response
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

    return {
      success: true,
      data: transformedInterests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching property interests:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch property interests',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function reviewPropertyInterest(data: z.infer<typeof reviewPropertyInterestSchema>) {
  try {
    // Validate input
    const validatedData = reviewPropertyInterestSchema.parse(data);

    // Check if interest exists
    const interest = await db.propertyInterest.findUnique({
      where: { id: validatedData.id },
    });

    if (!interest) {
      return {
        success: false,
        error: {
          message: 'Property interest not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check if reviewer exists
    const reviewer = await db.user.findUnique({
      where: { id: validatedData.reviewedBy },
    });

    if (!reviewer) {
      return {
        success: false,
        error: {
          message: 'Reviewer not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Update interest dengan review
    const updatedInterest = await db.propertyInterest.update({
      where: { id: validatedData.id },
      data: {
        status: validatedData.status,
        notes: validatedData.notes || interest.notes,
        reviewedAt: new Date(),
      },
    });

    // Transform response
    const transformedInterest = {
      id: updatedInterest.id,
      propertyId: updatedInterest.propertyId,
      userId: updatedInterest.userId,
      unitId: updatedInterest.unitId,
      unitSize: updatedInterest.unitSize ? Number(updatedInterest.unitSize) : undefined,
      isFirstHome: updatedInterest.isFirstHome,
      willOccupy: updatedInterest.willOccupy,
      email: updatedInterest.email,
      phoneNumber: updatedInterest.phoneNumber,
      status: updatedInterest.status as 'pending' | 'approved' | 'rejected' | undefined,
      notes: updatedInterest.notes,
      reviewedAt: updatedInterest.reviewedAt?.toISOString(),
      createdAt: updatedInterest.createdAt.toISOString(),
    };

    revalidatePath('/admin/properties');
    revalidatePath(`/property/${updatedInterest.propertyId}`);
    revalidatePath('/api/property-interests');

    return {
      success: true,
      data: transformedInterest,
    };
  } catch (error) {
    console.error('Error reviewing property interest:', error);

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
        message: 'Failed to review property interest',
        code: 'REVIEW_ERROR',
      },
    };
  }
}



