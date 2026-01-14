# Backend Server

Express.js backend server for The Century time capsule application.

## Quick Start

See [PHASE2_SETUP.md](./PHASE2_SETUP.md) for detailed setup instructions, or [LIVE_SETUP.md](./LIVE_SETUP.md) for production deployment.

**Quick setup:**
1. `npm install`
2. Set up PostgreSQL database (Supabase recommended)
3. Run migrations:
   - Phase 1: `server/src/db/migration_001_phase1.sql`
   - Phase 2: `server/src/db/migration_002_phase2.sql`
4. Copy `.env.example` to `.env` and fill in values
5. `npm run server`

The server runs on `http://localhost:5001` by default (or `PORT` from `.env`).

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Capsules
- `POST /api/capsules` - Create a new capsule
- `GET /api/capsules/:public_id` - Get a capsule by public ID
- `POST /api/capsules/:public_id/initiate-payment` - Transition to pending_payment
- `POST /api/capsules/:public_id/seal` - Seal capsule (paid → sealed)

### Media (Phase 2)
- `POST /api/capsules/media/create-upload` - Generate upload path
- `POST /api/capsules/media/finalize-upload` - Finalize upload and link to capsule
- `POST /api/capsules/media/remove` - Remove media from capsule

### Payments
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment intent (dev/test only)

### Emails
- `POST /api/emails/send-certificate` - Send certificate email

## Documentation

- **[PHASE2_SETUP.md](./PHASE2_SETUP.md)** - Complete Phase 2 setup guide (Supabase Storage)
- **[LIVE_SETUP.md](./LIVE_SETUP.md)** - Production deployment guide
- **[SMOKE_TESTS.md](./SMOKE_TESTS.md)** - Pre-launch testing checklist
- **[QUICK_START_LIVE.md](../QUICK_START_LIVE.md)** - Quick start for going live

## Development

- `npm run server` - Start development server with hot reload
- `npm run server:build` - Build TypeScript to JavaScript
- `npm run server:start` - Start production server (after build)
