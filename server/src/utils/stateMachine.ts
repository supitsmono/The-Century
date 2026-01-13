import { CapsuleState } from '../types/capsule.js';

/**
 * Simple state machine for capsule lifecycle
 * States: draft → pending_payment → paid → sealed
 */

// Valid state transitions
const VALID_TRANSITIONS: Record<CapsuleState, CapsuleState[]> = {
  draft: ['pending_payment'], // Can only move to pending_payment
  pending_payment: ['paid', 'draft'], // Can move to paid (via webhook) or back to draft (if payment fails)
  paid: ['sealed'], // Can only move to sealed
  sealed: [] // Terminal state, no transitions allowed
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: CapsuleState, to: CapsuleState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Validate state transition and throw error if invalid
 */
export function validateTransition(from: CapsuleState, to: CapsuleState): void {
  if (!isValidTransition(from, to)) {
    const error = new Error(
      `Invalid state transition: ${from} → ${to}. Allowed transitions from ${from}: ${VALID_TRANSITIONS[from].join(', ')}`
    ) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Get initial state (draft)
 */
export function getInitialState(): CapsuleState {
  return 'draft';
}

/**
 * Check if state allows payment processing
 */
export function canProcessPayment(state: CapsuleState): boolean {
  return state === 'pending_payment';
}

/**
 * Check if state allows sealing
 */
export function canSeal(state: CapsuleState): boolean {
  return state === 'paid';
}
