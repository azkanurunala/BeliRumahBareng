import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createWatchlistSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/watchlists - Get all watchlists dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = searchParams.get('userId') || '';
    const propertyId = searchParams.get('propertyId') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (propertyId) where.propertyId = propertyId;

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

    // Transform ke format yang diharapkan frontend
    const transformedWatchlists = watchlists.map((watchlist) => ({
      id: watchlist.id,
      propertyId: watchlist.propertyId,
      userId: watchlist.userId,
      createdAt: watchlist.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedWatchlists,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch watchlists',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/watchlists - Add property to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createWatchlistSchema.parse(body);

    // Check if property exists
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
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
      throw new ConflictError('Property is already in watchlist');
    }

    // Create watchlist entry
    const watchlist = await db.watchlist.create({
      data: {
        propertyId: validatedData.propertyId,
        userId: validatedData.userId,
      },
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
          },
        },
      },
    });

    // Transform response
    const transformedWatchlist = {
      id: watchlist.id,
      propertyId: watchlist.propertyId,
      userId: watchlist.userId,
      createdAt: watchlist.createdAt.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: transformedWatchlist,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating watchlist:', error);

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

    if (error instanceof ConflictError) {
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
          message: 'Failed to add to watchlist',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlists - Remove property from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');

    if (!propertyId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'propertyId and userId are required',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 }
      );
    }

    // Check if watchlist entry exists
    const watchlist = await db.watchlist.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });

    if (!watchlist) {
      throw new NotFoundError('Watchlist entry not found');
    }

    // Delete watchlist entry
    await db.watchlist.delete({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { propertyId, userId },
    });
  } catch (error) {
    console.error('Error deleting watchlist:', error);

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
          message: 'Failed to remove from watchlist',
          code: 'DELETE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}






