import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/activity-logs - Get activity logs (read-only, immutable audit trail)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId') || '';
    const actorId = searchParams.get('actorId') || '';
    const action = searchParams.get('action') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (transactionId) where.transactionId = transactionId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;

    // Get activity logs dengan pagination
    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          transaction: {
            select: {
              id: true,
              projectId: true,
              userId: true,
              unitId: true,
              state: true,
            },
          },
        },
      }),
      db.activityLog.count({ where }),
    ]);

    // Transform ke format yang diharapkan frontend
    const transformedLogs = logs.map((log) => ({
      id: log.id,
      transactionId: log.transactionId,
      action: log.action,
      actorId: log.actorId,
      actorRole: log.actorRole,
      fromState: log.fromState,
      toState: log.toState,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      actor: {
        id: log.actor.id,
        name: log.actor.name,
        email: log.actor.email,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformedLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch activity logs',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST is not allowed - activity logs are immutable and auto-created
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Activity logs are immutable and cannot be created manually',
        code: 'METHOD_NOT_ALLOWED',
      },
    },
    { status: 405 }
  );
}

