import { z } from 'zod';

// Capsule state schema
export const capsuleStateSchema = z.enum(['draft', 'pending_payment', 'paid', 'sealed']);

// Base capsule schema for validation
export const capsuleSchema = z.object({
  name: z.string().max(255).optional(),
  country: z.string().min(1).max(100),
  town: z.string().min(1).max(100),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  message: z.string().min(1).max(5000), // 5000 char limit
  photos: z.array(z.string()).max(10), // Max 10 photos
  video: z.string().optional(), // Will be storage path in Phase 2
  createdAt: z.date().optional(),
  ageAtCreation: z.number().int().min(0).max(150),
  openAt: z.date() // TIMESTAMPTZ
});

// Create capsule request schema
export const createCapsuleRequestSchema = z.object({
  capsule: capsuleSchema,
  email: z.string().email().optional()
});

// Payment intent creation schema
export const createPaymentIntentSchema = z.object({
  public_id: z.string().uuid(),
  amount: z.number().int().positive().optional(), // Optional, can default on backend
  currency: z.string().length(3).default('eur')
});

// Payment update schema (for webhook)
export const paymentUpdateSchema = z.object({
  payment_id: z.string().min(1),
  payment_status: z.string().min(1)
});

// Type exports for TypeScript
export type CapsuleInput = z.infer<typeof capsuleSchema>;
export type CreateCapsuleRequestInput = z.infer<typeof createCapsuleRequestSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
