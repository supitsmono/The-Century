import { Router } from 'express';
import { createPaymentIntent } from '../controllers/paymentController.js';
import { paymentIntentLimiter } from '../middleware/rateLimiter.js';

export const paymentRoutes = Router();

// Create payment intent (rate limited)
paymentRoutes.post('/create-intent', paymentIntentLimiter, createPaymentIntent);

// Note: Webhook route is handled directly in index.ts to ensure raw body parsing