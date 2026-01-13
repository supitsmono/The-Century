import { Request, Response } from 'express';
import { pool } from '../db/connection.js';
import { CapsuleDB, CreateCapsuleRequest, CapsuleResponse, CapsuleState } from '../types/capsule.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createCapsuleRequestSchema } from '../validation/capsuleSchemas.js';
import { validateTransition, getInitialState } from '../utils/stateMachine.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new capsule (draft state)
 */
export const createCapsule = asyncHandler(async (req: Request<{}, CapsuleResponse, CreateCapsuleRequest>, res: Response<CapsuleResponse>) => {
  // Validate input with Zod
  const validationResult = createCapsuleRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    const error = new Error(`Validation failed: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const { capsule, email } = validationResult.data;
  const public_id = uuidv4();
  const state: CapsuleState = getInitialState(); // 'draft'

  // Convert openAt Date to TIMESTAMPTZ
  const openAt = capsule.openAt || new Date('2125-01-01T00:00:00Z');

  const query = `
    INSERT INTO capsules (
      public_id, name, country, town, dob, message, photos, video,
      age_at_creation, open_at, state, email, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING public_id
  `;

  const values = [
    public_id,
    capsule.name || null,
    capsule.country,
    capsule.town,
    capsule.dob,
    capsule.message,
    capsule.photos || [],
    capsule.video || null,
    capsule.ageAtCreation,
    openAt,
    state,
    email || null,
    capsule.createdAt || new Date()
  ];

  const result = await pool.query(query, values);
  const returned_public_id = result.rows[0].public_id;

  res.status(201).json({
    public_id: returned_public_id,
    message: 'Capsule created successfully',
    ...(email && { email })
  });
});

/**
 * Get capsule by public_id (API uses public_id, never internal id)
 */
export const getCapsule = asyncHandler(async (req: Request<{ public_id: string }>, res: Response<CapsuleDB>) => {
  const { public_id } = req.params;

  const query = 'SELECT * FROM capsules WHERE public_id = $1';
  const result = await pool.query(query, [public_id]);

  if (result.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const row = result.rows[0];
  
  // Map database row to CapsuleDB type
  const capsule: CapsuleDB = {
    id: row.id,
    public_id: row.public_id,
    name: row.name,
    country: row.country,
    town: row.town,
    dob: row.dob,
    message: row.message,
    photos: row.photos || [],
    video: row.video,
    createdAt: row.created_at,
    ageAtCreation: row.age_at_creation,
    openAt: row.open_at,
    state: row.state as CapsuleState,
    payment_status: row.payment_status,
    payment_id: row.payment_id,
    email: row.email
  };

  res.json(capsule);
});

/**
 * Transition capsule to pending_payment state
 * Called when user initiates payment
 */
export const initiatePayment = asyncHandler(async (req: Request<{ public_id: string }>, res: Response) => {
  const { public_id } = req.params;

  // Get current state
  const getStateQuery = 'SELECT state FROM capsules WHERE public_id = $1';
  const stateResult = await pool.query(getStateQuery, [public_id]);

  if (stateResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const currentState = stateResult.rows[0].state as CapsuleState;
  const newState: CapsuleState = 'pending_payment';

  // Validate transition
  validateTransition(currentState, newState);

  // Update state
  const updateQuery = 'UPDATE capsules SET state = $1 WHERE public_id = $2 RETURNING public_id';
  const updateResult = await pool.query(updateQuery, [newState, public_id]);

  res.json({ 
    message: 'Payment initiated',
    public_id: updateResult.rows[0].public_id,
    state: newState
  });
});

/**
 * Update capsule payment status (internal, called by webhook)
 * This enforces that only webhooks can transition to 'paid'
 */
export const updateCapsulePaymentStatus = asyncHandler(async (
  req: Request<{ public_id: string }, {}, { payment_id: string; state: CapsuleState }>,
  res: Response
) => {
  const { public_id } = req.params;
  const { payment_id, state } = req.body;

  // Get current state
  const getStateQuery = 'SELECT state FROM capsules WHERE public_id = $1';
  const stateResult = await pool.query(getStateQuery, [public_id]);

  if (stateResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const currentState = stateResult.rows[0].state as CapsuleState;

  // Validate transition
  validateTransition(currentState, state);

  // Update payment info and state
  const updateQuery = `
    UPDATE capsules 
    SET payment_id = $1, state = $2, payment_status = $2
    WHERE public_id = $3
    RETURNING public_id, state
  `;
  const updateResult = await pool.query(updateQuery, [payment_id, state, public_id]);

  res.json({ 
    message: 'Payment status updated',
    public_id: updateResult.rows[0].public_id,
    state: updateResult.rows[0].state
  });
});

/**
 * Seal capsule (transition from paid to sealed)
 */
export const sealCapsule = asyncHandler(async (req: Request<{ public_id: string }>, res: Response) => {
  const { public_id } = req.params;

  // Get current state
  const getStateQuery = 'SELECT state FROM capsules WHERE public_id = $1';
  const stateResult = await pool.query(getStateQuery, [public_id]);

  if (stateResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const currentState = stateResult.rows[0].state as CapsuleState;
  const newState: CapsuleState = 'sealed';

  // Validate transition
  validateTransition(currentState, newState);

  // Update state
  const updateQuery = 'UPDATE capsules SET state = $1 WHERE public_id = $2 RETURNING public_id, state';
  const updateResult = await pool.query(updateQuery, [newState, public_id]);

  res.json({ 
    message: 'Capsule sealed',
    public_id: updateResult.rows[0].public_id,
    state: updateResult.rows[0].state
  });
});