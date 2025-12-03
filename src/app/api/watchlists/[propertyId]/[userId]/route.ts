import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NotFoundError } from '@/lib/errors';

// GET /api/watchlists/[propertyId]/[userId] - Check if property is in user's watchlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string; userId: string }> }
) {
  try {
    const { propertyId, userId } = await params;

    const watchlist = await db.watchlist.findUnique({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            location: true,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to check watchlist',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/watchlists/[propertyId]/[userId] - Remove property from watchlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string; userId: string }> }
) {
  try {
    const { propertyId, userId } = await params;

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

