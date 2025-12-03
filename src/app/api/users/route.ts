import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createUserSchema, updateUserSchema } from '@/lib/validations';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors';
import { z } from 'zod';

// GET /api/users - Get all users dengan pagination dan filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
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

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch users',
          code: 'FETCH_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already exists');
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

    return NextResponse.json(
      {
        success: true,
        data: transformedUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);

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
          message: 'Failed to create user',
          code: 'CREATE_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

