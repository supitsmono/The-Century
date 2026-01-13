# Phase 1 Setup Instructions

## Prerequisites

1. Node.js 24+ installed
2. PostgreSQL database (local or Supabase)
3. Stripe account (for payments)

## Step 1: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Express, TypeScript, PostgreSQL client
- Stripe SDK
- Zod (validation)
- express-rate-limit (rate limiting)
- uuid (for public IDs)

## Step 2: Database Setup

### Option A: Local PostgreSQL

1. Create database:
   ```bash
   createdb the_century
   ```

2. Run migration:
   ```bash
   psql the_century -f server/src/db/migration_001_phase1.sql
   ```

### Option B: Supabase (Recommended for production)

1. Create Supabase project at https://supabase.com
2. Go to SQL Editor
3. Copy contents of `server/src/db/migration_001_phase1.sql`
4. Run in SQL Editor
5. Get connection string from Settings → Database

## Step 3: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your values:
   ```env
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=http://localhost:3000
   ```

## Step 4: Stripe Setup

1. **Get API Keys**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy "Secret key" → `STRIPE_SECRET_KEY`

2. **Setup Webhook**:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `http://localhost:5000/api/payments/webhook` (or your server URL)
   - Events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

   **For local development**, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   This gives you a webhook secret starting with `whsec_`

## Step 5: Start Server

Development (with hot reload):
```bash
npm run server
```

Build and run production:
```bash
npm run server:build
npm run server:start
```

Server runs on `http://localhost:5000` by default.

## Step 6: Verify Setup

1. **Health check**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test database connection**:
   Check server logs for "Database connected successfully"

3. **Test Stripe** (optional):
   ```bash
   curl -X POST http://localhost:5000/api/payments/create-intent \
     -H "Content-Type: application/json" \
     -d '{"public_id":"test-uuid-here","amount":2999,"currency":"eur"}'
   ```

## Troubleshooting

### Database Connection Error
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify credentials

### Stripe Webhook Errors
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- For local dev, use Stripe CLI (`stripe listen`)
- Check webhook endpoint is accessible

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (24+)

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend URL
- For multiple origins, use comma-separated list

## Next Steps

- **Phase 2**: Supabase Storage integration (media files)
- **Phase 3**: Frontend API integration (remove localStorage)

