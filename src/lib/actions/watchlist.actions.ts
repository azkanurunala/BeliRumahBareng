'use server';

import { db } from '@/lib/db';
import { createWatchlistSchema, deleteWatchlistSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Server Actions untuk Watchlist Operations
 */

export async function addToWatchlist(data: z.infer<typeof createWatchlistSchema>) {
  try {
    // Validate input
    const validatedData = createWatchlistSchema.parse(data);

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

    // Check if already in watchlist
    const existing = await db.watchlist.findUnique({
      where: {
        propertyId_userId: {
          propertyId: validatedData.propertyId,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: {
          message: 'Property is already in watchlist',
          code: 'CONFLICT',
        },
      };
    }

    // Create watchlist entry
    const watchlist = await db.watchlist.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: validatedData.userId,
      },
    });

    // Transform response
    const transformedWatchlist = {
      id: watchlist.id,
      propertyId: watchlist.propertyId,
      userId: watchlist.userId,
      createdAt: watchlist.createdAt.toISOString(),
    };

    revalidatePath('/properties');
    revalidatePath(`/property/${validatedData.propertyId}`);
    revalidatePath('/api/watchlists');

    return {
      success: true,
      data: transformedWatchlist,
    };
  } catch (error) {
    console.error('Error adding to watchlist:', error);

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
        message: 'Failed to add to watchlist',
        code: 'CREATE_ERROR',
      },
    };
  }
}

export async function removeFromWatchlist(data: z.infer<typeof deleteWatchlistSchema>) {
  try {
    // Validate input
    const validatedData = deleteWatchlistSchema.parse(data);

    // Check if watchlist entry exists
    const watchlist = await db.watchlist.findUnique({
      where: {
        propertyId_userId: {
          propertyId: validatedData.propertyId,
          userId: validatedData.userId,
        },
      },
    });

    if (!watchlist) {
      return {
        success: false,
        error: {
          message: 'Watchlist entry not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Delete watchlist entry
    await db.watchlist.delete({
      where: {
        propertyId_userId: {
          propertyId: validatedData.propertyId,
          userId: validatedData.userId,
        },
      },
    });

    revalidatePath('/properties');
    revalidatePath(`/property/${validatedData.propertyId}`);
    revalidatePath('/api/watchlists');

    return {
      success: true,
      data: { propertyId: validatedData.propertyId, userId: validatedData.userId },
    };
  } catch (error) {
    console.error('Error removing from watchlist:', error);

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
        message: 'Failed to remove from watchlist',
        code: 'DELETE_ERROR',
      },
    };
  }
}

export async function getWatchlists(options?: {
  page?: number;
  limit?: number;
  userId?: string;
  propertyId?: string;
}) {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.propertyId) where.propertyId = options.propertyId;

    // Get watchlists dengan pagination
    const [watchlists, total] = await Promise.all([
      db.watchlist.findMany({
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
              type: true,
              images: {
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
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
      }),
      db.watchlist.count({ where }),
    ]);

    // Transform response
    const transformedWatchlists = watchlists.map((watchlist) => ({
      id: watchlist.id,
      propertyId: watchlist.propertyId,
      userId: watchlist.userId,
      createdAt: watchlist.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: transformedWatchlists,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching watchlists:', error);

    return {
      success: false,
      error: {
        message: 'Failed to fetch watchlists',
        code: 'FETCH_ERROR',
      },
    };
  }
}

export async function isInWatchlist(propertyId: string, userId: string) {
  try {
    const watchlist = await db.watchlist.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });

    return {
      success: true,
      data: {
        exists: !!watchlist,
        watchlist: watchlist ? {
          id: watchlist.id,
          propertyId: watchlist.propertyId,
          userId: watchlist.userId,
          createdAt: watchlist.createdAt.toISOString(),
        } : null,
      },
    };
  } catch (error) {
    console.error('Error checking watchlist:', error);

    return {
      success: false,
      error: {
        message: 'Failed to check watchlist',
        code: 'FETCH_ERROR',
      },
    };
  }
}








