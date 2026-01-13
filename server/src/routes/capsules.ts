import { Router } from 'express';
import { createCapsule, getCapsule, initiatePayment, sealCapsule } from '../controllers/capsuleController.js';
import { capsuleCreationLimiter } from '../middleware/rateLimiter.js';

export const capsuleRoutes = Router();

// Create capsule (rate limited)
capsuleRoutes.post('/', capsuleCreationLimiter, createCapsule);

// Get capsule by public_id
capsuleRoutes.get('/:public_id', getCapsule);

// Initiate payment (transition to pending_payment)
capsuleRoutes.post('/:public_id/initiate-payment', initiatePayment);

// Seal capsule (transition to sealed, after payment)
capsuleRoutes.post('/:public_id/seal', sealCapsule);