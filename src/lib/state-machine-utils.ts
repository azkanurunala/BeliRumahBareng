import type { PurchaseTransactionState } from '@/lib/types';

/**
 * Valid state transitions
 */
export const VALID_TRANSITIONS: Record<PurchaseTransactionState, PurchaseTransactionState[]> = {
  DRAFT: ['BOOKED'],
  BOOKED: ['INTERVIEWED'],
  INTERVIEWED: ['CASH_PROCESS', 'KPR_PROCESS'],
  CASH_PROCESS: ['UNDER_CONSTRUCTION'],
  KPR_PROCESS: ['UNDER_CONSTRUCTION', 'CASH_PROCESS'], // Can switch to cash if KPR rejected
  UNDER_CONSTRUCTION: ['HANDOVER'],
  HANDOVER: ['COMPLETED'],
  COMPLETED: [], // Final state, no transitions allowed
};

/**
 * Validate state transition
 */
export function isValidTransition(
  fromState: PurchaseTransactionState,
  toState: PurchaseTransactionState
): boolean {
  return VALID_TRANSITIONS[fromState]?.includes(toState) ?? false;
}

/**
 * Get allowed transitions for a state
 */
export function getAllowedTransitions(
  state: PurchaseTransactionState
): PurchaseTransactionState[] {
  return VALID_TRANSITIONS[state] ?? [];
}

