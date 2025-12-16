'use server';

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { UnauthorizedError, ForbiddenError } from './errors';

/**
 * Get current user from request
 * Supports both header-based and body-based userId
 */
export async function getCurrentUser(request: NextRequest): Promise<{
  id: string;
  role: number;
  name: string;
  email: string;
}> {
  // Try to get userId from header first (for future JWT implementation)
  const userIdFromHeader = request.headers.get('x-user-id');
  
  // If not in header, try to get from request body (for current implementation)
  let userId = userIdFromHeader;
  
  if (!userId) {
    try {
      const body = await request.clone().json().catch(() => ({}));
      userId = body.userId || body.actorId;
    } catch {
      // If body parsing fails, continue without it
    }
  }

  if (!userId) {
    throw new UnauthorizedError('User ID is required');
  }

  // Fetch user from database
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}

/**
 * Verify user is admin
 */
export async function requireAdmin(request: NextRequest): Promise<{
  id: string;
  role: number;
  name: string;
  email: string;
}> {
  const user = await getCurrentUser(request);
  
  if (user.role !== 2) {
    throw new ForbiddenError('Admin access required');
  }

  return user;
}

/**
 * Verify user owns resource or is admin
 */
export async function requireOwnerOrAdmin(
  request: NextRequest,
  resourceUserId: string
): Promise<{
  id: string;
  role: number;
  name: string;
  email: string;
}> {
  const user = await getCurrentUser(request);
  
  // Admin can access any resource
  if (user.role === 2) {
    return user;
  }

  // User must own the resource
  if (user.id !== resourceUserId) {
    throw new ForbiddenError('Access denied: You can only access your own resources');
  }

  return user;
}

