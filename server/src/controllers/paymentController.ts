import { Request, Response } from 'express';
import Stripe from 'stripe';
import { pool } from '../db/connection.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createPaymentIntentSchema } from '../validation/capsuleSchemas.js';
import { canProcessPayment } from '../utils/stateMachine.js';
import { updateCapsulePaymentStatus } from './capsuleController.js';

// Initialize Stripe (only if key is provided)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

/**
 * Create payment intent for a capsule
 */
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  if (!stripe) {
    const error = new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.') as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  // Validate input
  const validationResult = createPaymentIntentSchema.safeParse(req.body);
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

  const { public_id, amount, currency } = validationResult.data;

  // Get capsule and verify state
  const capsuleQuery = 'SELECT id, state FROM capsules WHERE public_id = $1';
  const capsuleResult = await pool.query(capsuleQuery, [public_id]);

  if (capsuleResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const capsule = capsuleResult.rows[0];
  let state = capsule.state;

  // If capsule is in draft state, transition to pending_payment
  if (state === 'draft') {
    const updateQuery = 'UPDATE capsules SET state = $1 WHERE public_id = $2 RETURNING state';
    const updateResult = await pool.query(updateQuery, ['pending_payment', public_id]);
    state = updateResult.rows[0].state;
  }

  // Verify capsule can accept payment
  if (!canProcessPayment(state)) {
    const error = new Error(`Capsule is in ${state} state and cannot process payment`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Default amount (can be configured)
  const paymentAmount = amount || 2999; // €29.99 in cents
  const paymentCurrency = currency || 'eur';

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: paymentAmount,
    currency: paymentCurrency,
    metadata: {
      capsule_public_id: public_id,
      capsule_internal_id: capsule.id.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Update capsule with payment_intent_id (but not state yet - state changes on webhook)
  // Store payment_id for reference
  await pool.query(
    'UPDATE capsules SET payment_id = $1 WHERE public_id = $2',
    [paymentIntent.id, public_id]
  );

  res.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: paymentAmount,
    currency: paymentCurrency,
  });
});

/**
 * Confirm a payment intent (for testing purposes only)
 * Uses Stripe test payment method tokens for safe testing
 * SECURITY: Only available in development/test mode
 */
export const confirmPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  // Security: Only allow in development/test mode
  if (process.env.NODE_ENV === 'production') {
    const error = new Error('This endpoint is not available in production') as Error & { statusCode?: number };
    error.statusCode = 403;
    throw error;
  }

  if (!stripe) {
    const error = new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.') as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  const { payment_intent_id } = req.body;

  if (!payment_intent_id) {
    const error = new Error('payment_intent_id is required') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  try {
    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    // Check if already succeeded
    if (paymentIntent.status === 'succeeded') {
      return res.json({
        message: 'Payment intent already succeeded',
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
      });
    }

    // For test mode: use Stripe test payment method token
    // This is a safe way to test without exposing card data
    const testPaymentMethodId = 'pm_card_visa'; // Stripe test token for Visa card

    // Attach test payment method to payment intent
    await stripe.paymentIntents.update(paymentIntent.id, {
      payment_method: testPaymentMethodId,
    });

    // Confirm payment intent with return_url (required for redirect-based payment methods)
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
      return_url: 'https://example.com/return', // Required for some payment methods
    });

    res.json({
      message: 'Payment intent confirmed',
      payment_intent_id: confirmedIntent.id,
      status: confirmedIntent.status,
      client_secret: confirmedIntent.client_secret,
    });
  } catch (error: any) {
    // Handle Stripe errors
    const errorMessage = error.type 
      ? `Stripe error (${error.type}): ${error.message}`
      : `Failed to confirm payment intent: ${error.message}`;
    
    const err = new Error(errorMessage) as Error & { statusCode?: number };
    err.statusCode = error.statusCode || 400;
    throw err;
  }
});

/**
 * Handle Stripe webhook events
 * Verifies signature and processes payment events with idempotency
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!stripe) {
    const error = new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.') as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  const sig = req.headers['stripe-signature'];

  if (!sig) {
    const error = new Error('Missing stripe-signature header') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const error = new Error('STRIPE_WEBHOOK_SECRET not configured') as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const error = new Error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Check idempotency: have we already processed this event?
  const idempotencyCheckQuery = 'SELECT id FROM webhook_events WHERE stripe_event_id = $1';
  const idempotencyResult = await pool.query(idempotencyCheckQuery, [event.id]);

  if (idempotencyResult.rows.length > 0) {
    // Event already processed, return success (idempotent)
    console.log(`Webhook event ${event.id} already processed, skipping`);
    return res.json({ received: true, idempotent: true });
  }

  // Process payment events
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const capsulePublicId = paymentIntent.metadata.capsule_public_id;

    if (!capsulePublicId) {
      // Event for payment intent without our metadata (test events, etc.)
      // Log but don't fail - return 200 to acknowledge receipt
      console.log(`Payment intent ${paymentIntent.id} succeeded but missing capsule metadata (ignoring)`);
      // Still record event for idempotency
      try {
        await pool.query(
          'INSERT INTO webhook_events (stripe_event_id) VALUES ($1) ON CONFLICT DO NOTHING',
          [event.id]
        );
      } catch (err) {
        // Log but don't fail
        console.error('Failed to record webhook event:', err);
      }
      return res.json({ received: true, ignored: true, reason: 'Missing capsule metadata' });
    }

    // Get capsule internal ID
    const capsuleQuery = 'SELECT id FROM capsules WHERE public_id = $1';
    const capsuleResult = await pool.query(capsuleQuery, [capsulePublicId]);

    if (capsuleResult.rows.length === 0) {
      console.error(`Capsule not found for public_id: ${capsulePublicId}`);
      return res.status(404).json({ error: 'Capsule not found' });
    }

    const capsuleId = capsuleResult.rows[0].id;

    // Use a transaction to ensure atomicity
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record webhook event (idempotency)
      await client.query(
        'INSERT INTO webhook_events (stripe_event_id, capsule_id) VALUES ($1, $2)',
        [event.id, capsuleId]
      );

      // Update capsule state to 'paid'
      // We use the controller function but need to adapt for internal use
      const updateQuery = `
        UPDATE capsules 
        SET payment_id = $1, state = $2, payment_status = $2
        WHERE public_id = $3 AND state = 'pending_payment'
        RETURNING id
      `;
      const updateResult = await client.query(updateQuery, [
        paymentIntent.id,
        'paid',
        capsulePublicId
      ]);

      if (updateResult.rows.length === 0) {
        throw new Error('Capsule state update failed (may already be paid or invalid state)');
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    console.log(`Payment succeeded for capsule ${capsulePublicId}`);
  } else if (event.type === 'payment_intent.payment_failed') {
    // Log failure but don't change state (capsule stays in pending_payment)
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`Payment failed for payment intent ${paymentIntent.id}`);
  }

  // Record webhook event for idempotency (even if we didn't process it)
  try {
    await pool.query(
      'INSERT INTO webhook_events (stripe_event_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [event.id]
    );
  } catch (err) {
    // Log but don't fail (idempotency recording is best-effort)
    console.error('Failed to record webhook event:', err);
  }

  res.json({ received: true });
});
