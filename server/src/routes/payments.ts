import { Router } from 'express';
import { createPaymentIntent, confirmPaymentIntent, createCheckoutSession } from '../controllers/paymentController.js';
import { paymentIntentLimiter } from '../middleware/rateLimiter.js';

export const paymentRoutes = Router();

// Create payment intent (rate limited) - Deprecated, use create-checkout-session
paymentRoutes.post('/create-intent', paymentIntentLimiter, createPaymentIntent);

// Create checkout session (Phase 3C: Stripe Checkout)
paymentRoutes.post('/create-checkout-session', paymentIntentLimiter, createCheckoutSession);

// Confirm payment intent (for testing - completes payment with test card)
paymentRoutes.post('/confirm', paymentIntentLimiter, confirmPaymentIntent);

// Note: Webhook route is handled directly in index.ts to ensure raw body parsing