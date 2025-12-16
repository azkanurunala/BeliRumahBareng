'use server';

import { db } from '@/lib/db';

/**
 * Lock unit (when booking fee is paid)
 */
export async function lockUnit(
  projectId: string,
  unitId: number,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if unit exists and is not already locked
    const unitAssignment = await db.unitAssignment.findUnique({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
    });

    if (!unitAssignment) {
      return { success: false, error: 'Unit assignment not found' };
    }

    if (unitAssignment.isLocked) {
      return { success: false, error: 'Unit is already locked' };
    }

    // Lock the unit
    await db.unitAssignment.update({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: transactionId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error locking unit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unlock unit (when transaction is cancelled)
 */
export async function unlockUnit(
  projectId: string,
  unitId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const unitAssignment = await db.unitAssignment.findUnique({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
    });

    if (!unitAssignment) {
      return { success: false, error: 'Unit assignment not found' };
    }

    if (!unitAssignment.isLocked) {
      return { success: false, error: 'Unit is not locked' };
    }

    // Unlock the unit
    await db.unitAssignment.update({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error unlocking unit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if unit is available (not locked)
 */
export async function isUnitAvailable(
  projectId: string,
  unitId: number
): Promise<boolean> {
  try {
    const unitAssignment = await db.unitAssignment.findUnique({
      where: {
        projectId_unitId: {
          projectId,
          unitId,
        },
      },
    });

    if (!unitAssignment) {
      return false;
    }

    return !unitAssignment.isLocked;
  } catch (error) {
    console.error('Error checking unit availability:', error);
    return false;
  }
}

