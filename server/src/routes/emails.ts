import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

export const emailRoutes = Router();

// Placeholder for email sending
// TODO: Implement email service (SendGrid, Resend, etc.)

emailRoutes.post('/send-certificate', asyncHandler(async (req: Request, res: Response) => {
  // Send certificate email
  // This will be implemented when email service is added
  const { email, capsuleId } = req.body;
  
  if (!email || !capsuleId) {
    const error = new Error('Email and capsuleId are required') as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // TODO: Send email with certificate download link
  res.json({ message: 'Certificate email sending not yet implemented', email, capsuleId });
}));
