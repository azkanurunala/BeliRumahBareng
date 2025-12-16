'use server';

import { db } from '@/lib/db';
import type {
  ActivityLog,
  ActivityLogAction,
  ActorRole,
  PurchaseTransactionState,
} from '@/lib/types';

/**
 * Create activity log (immutable audit trail)
 */
export async function createActivityLog(data: {
  transactionId: string;
  action: ActivityLogAction;
  actorId: string;
  actorRole: ActorRole;
  fromState?: PurchaseTransactionState;
  toState?: PurchaseTransactionState;
  details?: string;
}): Promise<ActivityLog> {
  try {
    const activityLog = await db.activityLog.create({
      data: {
        transactionId: data.transactionId,
        action: data.action,
        actorId: data.actorId,
        actorRole: data.actorRole,
        fromState: data.fromState,
        toState: data.toState,
        details: data.details,
      },
    });

    return {
      id: activityLog.id,
      transactionId: activityLog.transactionId,
      action: activityLog.action as ActivityLogAction,
      actorId: activityLog.actorId,
      actorRole: activityLog.actorRole as ActorRole,
      fromState: activityLog.fromState as PurchaseTransactionState | undefined,
      toState: activityLog.toState as PurchaseTransactionState | undefined,
      details: activityLog.details || undefined,
      createdAt: activityLog.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
}

