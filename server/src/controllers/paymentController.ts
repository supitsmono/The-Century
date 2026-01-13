import { Request, Response } from 'express';
import Stripe from 'stripe';
import { pool } from '../db/connection.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createPaymentIntentSchema } from '../validation/capsuleSchemas.js';
import { canProcessPayment } from '../utils/stateMachine.js';
import { updateCapsulePaymentStatus } from './capsuleController.js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

/**
 * Create payment intent for a capsule
 */
export const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validationResult = createPaymentIntentSchema.safeParse(req.body);
  if (!validationResult.success) {
    const error = new Error(`Validation failed: ${validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`) as Error & { statusCode?: number };
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
  const state = capsule.state;

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

  res.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: paymentAmount,
    currency: paymentCurrency,
  });
});

/**
 * Handle Stripe webhook events
 * Verifies signature and processes payment events with idempotency
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
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
      console.error('Payment intent missing capsule_public_id metadata');
      return res.status(400).json({ error: 'Missing capsule metadata' });
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
