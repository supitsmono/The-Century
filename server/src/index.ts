import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { capsuleRoutes } from './routes/capsules.js';
import { paymentRoutes } from './routes/payments.js';
import { emailRoutes } from './routes/emails.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Health check (before body parsers)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stripe webhook route (needs raw body, must be BEFORE json parser)
import { handleStripeWebhook } from './controllers/paymentController.js';
import { webhookLimiter } from './middleware/rateLimiter.js';
app.post('/api/payments/webhook', 
  express.raw({ type: 'application/json' }),
  webhookLimiter,
  handleStripeWebhook
);

// JSON body parser (for all other routes)
app.use(express.json({ limit: '10mb' })); // Reduced limit - media goes to storage in Phase 2
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/capsules', capsuleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
