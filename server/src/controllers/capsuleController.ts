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
    // Safe error message extraction
    const errorMessages = validationResult.error.errors 
      ? validationResult.error.errors.map(e => {
          const path = Array.isArray(e.path) ? e.path.join('.') : String(e.path || '');
          return `${path}: ${e.message}`;
        }).join(', ')
      : validationResult.error.message || 'Validation failed';
    
    const error = new Error(`Validation failed: ${errorMessages}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const { capsule, email } = validationResult.data;
  const public_id = uuidv4();
  const state: CapsuleState = getInitialState(); // 'draft'

  // Convert openAt Date to TIMESTAMPTZ
  const openAt = capsule.openAt ? new Date(capsule.openAt) : new Date('2125-01-01T00:00:00Z');
  
  // Calculate ageAtCreation if not provided (from dob to today)
  let ageAtCreation = capsule.ageAtCreation;
  if (!ageAtCreation && capsule.dob) {
    const dob = new Date(capsule.dob);
    const today = new Date();
    ageAtCreation = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      ageAtCreation--;
    }
  }
  // Default to 0 if still not set
  ageAtCreation = ageAtCreation ?? 0;
  
  // Extract archival date components for legacy columns (required by schema)
  const archivalYear = openAt.getUTCFullYear();
  const archivalMonth = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'][openAt.getUTCMonth()];
  const archivalDay = openAt.getUTCDate();
  const archivalTime = `${String(openAt.getUTCHours()).padStart(2, '0')}:${String(openAt.getUTCMinutes()).padStart(2, '0')}`;

  const query = `
    INSERT INTO capsules (
      public_id, name, country, town, dob, message, photos, video,
      photos_paths, video_path,
      age_at_creation, archival_year, archival_month, archival_day, archival_time,
      open_at, state, email, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING public_id, state
  `;

  // Phase 2: Don't store base64 photos/video, use storage paths instead
  // Legacy fields (photos, video) are kept empty for new capsules
  const values = [
    public_id,
    capsule.name || null,
    capsule.country,
    capsule.town,
    capsule.dob,
    capsule.message,
    [], // photos: DEPRECATED - Phase 2 uses photos_paths via media endpoints
    null, // video: DEPRECATED - Phase 2 uses video_path via media endpoints
    [], // photos_paths: Start empty, populated via media endpoints
    null, // video_path: Start empty, populated via media endpoints
    ageAtCreation,
    archivalYear,
    archivalMonth,
    archivalDay,
    archivalTime,
    openAt,
    state,
    email || null,
    capsule.createdAt || new Date()
  ];

  const result = await pool.query(query, values);
  const row = result.rows[0];

  res.status(201).json({
    public_id: row.public_id,
    message: 'Capsule created successfully',
    state: row.state, // Return initial state: "draft"
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
    photos: row.photos || [], // DEPRECATED: Legacy base64, use photos_paths
    photos_paths: row.photos_paths || [], // Phase 2: Storage paths
    photos_meta: row.photos_meta ? (typeof row.photos_meta === 'string' ? JSON.parse(row.photos_meta) : row.photos_meta) : undefined,
    video: row.video, // DEPRECATED: Legacy base64, use video_path
    video_path: row.video_path || undefined, // Phase 2: Storage path
    video_meta: row.video_meta ? (typeof row.video_meta === 'string' ? JSON.parse(row.video_meta) : row.video_meta) : undefined,
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

/**
 * Reset capsule to draft state (e.g., after payment cancellation)
 * Allows user to retry payment
 */
export const resetCapsuleToDraft = asyncHandler(async (req: Request<{ public_id: string }>, res: Response) => {
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
  const newState: CapsuleState = 'draft';

  // Only allow reset from pending_payment (payment cancelled/failed)
  if (currentState !== 'pending_payment') {
    const error = new Error(`Cannot reset capsule from ${currentState} to draft. Only allowed from pending_payment.`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Validate transition
  validateTransition(currentState, newState);

  // Update state and clear payment_id
  const updateQuery = 'UPDATE capsules SET state = $1, payment_id = NULL WHERE public_id = $2 RETURNING public_id, state';
  const updateResult = await pool.query(updateQuery, [newState, public_id]);

  res.json({ 
    message: 'Capsule reset to draft',
    public_id: updateResult.rows[0].public_id,
    state: updateResult.rows[0].state
  });
});