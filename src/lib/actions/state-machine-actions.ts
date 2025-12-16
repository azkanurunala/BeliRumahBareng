'use server';

import { db } from '@/lib/db';
import type { PurchaseTransactionState } from '@/lib/types';
import { createActivityLog } from './activity-log-actions';
import { isValidTransition } from '@/lib/state-machine-utils';

/**
 * Validate transition requirements
 */
export async function validateTransitionRequirements(
  transactionId: string,
  fromState: PurchaseTransactionState,
  toState: PurchaseTransactionState,
  paymentType?: 'cash' | 'kpr'
): Promise<{ valid: boolean; error?: string }> {
  const transaction = await db.purchaseTransaction.findUnique({
    where: { id: transactionId },
    include: {
      interviewRecord: true,
      kprStatus: true,
      appointments: true,
      constructionCheckpoints: true,
    },
  });

  if (!transaction) {
    return { valid: false, error: 'Transaction not found' };
  }

  if (transaction.state !== fromState) {
    return { valid: false, error: `Transaction is not in ${fromState} state` };
  }

  // Validate specific transition requirements
  switch (toState) {
    case 'BOOKED':
      // Booking fee must be paid
      if (!transaction.bookingFeeAmount || !transaction.paymentProofUrl) {
        return { valid: false, error: 'Booking fee payment required' };
      }
      break;

    case 'INTERVIEWED':
      // Interview record must exist
      if (!transaction.interviewRecord) {
        return { valid: false, error: 'Interview record required' };
      }
      if (transaction.interviewRecord.result !== 'PASSED') {
        return { valid: false, error: 'Interview must be PASSED to proceed' };
      }
      break;

    case 'CASH_PROCESS':
      // Payment type must be cash
      if (paymentType !== 'cash' && transaction.paymentType !== 'cash') {
        return { valid: false, error: 'Payment type must be cash' };
      }
      // Notaris appointment should be scheduled
      const notarisAppointment = transaction.appointments.find(
        (apt) => apt.type === 'notaris' && apt.status === 'scheduled'
      );
      if (!notarisAppointment) {
        return { valid: false, error: 'Notaris appointment must be scheduled' };
      }
      break;

    case 'KPR_PROCESS':
      // Payment type must be kpr
      if (paymentType !== 'kpr' && transaction.paymentType !== 'kpr') {
        return { valid: false, error: 'Payment type must be kpr' };
      }
      break;

    case 'UNDER_CONSTRUCTION':
      // For KPR, must be approved
      if (transaction.state === 'KPR_PROCESS') {
        if (!transaction.kprStatus || transaction.kprStatus.status !== 'APPROVED') {
          return { valid: false, error: 'KPR must be approved before construction' };
        }
      }
      break;

    case 'HANDOVER':
      // Construction must be 100% complete
      const completedCheckpoints = transaction.constructionCheckpoints.filter(
        (cp) => cp.status === 'completed'
      );
      const has100Percent = completedCheckpoints.some((cp) => cp.progress === 100);
      if (!has100Percent) {
        return { valid: false, error: 'Construction must be 100% complete' };
      }
      break;

    default:
      break;
  }

  return { valid: true };
}

/**
 * Transition purchase transaction state
 */
export async function transitionPurchaseTransactionState(
  transactionId: string,
  toState: PurchaseTransactionState,
  actorId: string,
  actorRole: 'admin' | 'sales' | 'customer',
  paymentType?: 'cash' | 'kpr',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transaction = await db.purchaseTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    const fromState = transaction.state as PurchaseTransactionState;

    // Validate transition
    if (!isValidTransition(fromState, toState)) {
      return {
        success: false,
        error: `Invalid transition from ${fromState} to ${toState}`,
      };
    }

    // Validate requirements
    const validation = await validateTransitionRequirements(
      transactionId,
      fromState,
      toState,
      paymentType || transaction.paymentType || undefined
    );

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Perform transition
    const updatedTransaction = await db.purchaseTransaction.update({
      where: { id: transactionId },
      data: {
        state: toState,
        paymentType: paymentType || transaction.paymentType,
      },
    });

    // Create activity log
    await createActivityLog({
      transactionId,
      action: 'state_transition',
      actorId,
      actorRole,
      fromState,
      toState,
      details: notes ? JSON.stringify({ notes }) : undefined,
    });

    return { success: true };
  } catch (error) {
    console.error('Error transitioning transaction state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

