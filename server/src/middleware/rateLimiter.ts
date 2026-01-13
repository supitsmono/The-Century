import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for capsule creation
 * Prevents abuse: max 10 capsules per hour per IP
 */
export const capsuleCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many capsule creation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for payment intent creation
 * Prevents abuse: max 20 payment intents per hour per IP
 */
export const paymentIntentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for webhook endpoint
 * Webhooks should come from Stripe only, but limit to prevent abuse
 * More lenient since Stripe may retry
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Stripe can send many events
  message: 'Too many webhook requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if request has Stripe signature (legitimate webhook)
    // This is basic protection; webhook signature verification is the real security
    return req.headers['stripe-signature'] !== undefined;
  }
});
