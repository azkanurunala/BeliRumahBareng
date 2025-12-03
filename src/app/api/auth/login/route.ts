import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email atau nomor telepon wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

// POST /api/auth/login - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email or phone
    const user = await db.user.findFirst({
      where: {
        OR: [
          { email: validatedData.emailOrPhone },
          { phoneNumber: validatedData.emailOrPhone },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        avatarUrl: true,
        avatarHint: true,
        role: true,
        passwordHash: true,
        oauthProvider: true,
        locationPreference: true,
        priceRange: true,
        investmentGoals: true,
        financialCapacity: true,
        timeHorizon: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email/nomor telepon atau password salah',
            code: 'INVALID_CREDENTIALS',
          },
        },
        { status: 401 }
      );
    }

    // Verify password (in real app, use bcrypt to compare hashed password)
    // For now, simple comparison (passwordHash should be hashed in production)
    if (user.passwordHash && user.passwordHash !== validatedData.password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Email/nomor telepon atau password salah',
            code: 'INVALID_CREDENTIALS',
          },
        },
        { status: 401 }
      );
    }

    // Transform response (exclude passwordHash)
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
    console.error('Error logging in:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to login',
          code: 'LOGIN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

