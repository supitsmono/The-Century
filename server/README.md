# Backend Server

Express.js backend server for The Century time capsule application.

## Quick Start

**Quick setup:**
1. `npm install`
2. Set up PostgreSQL database (Supabase recommended)
3. Run migrations:
   - Phase 1: `server/src/db/migration_001_phase1.sql`
   - Phase 2: `server/src/db/migration_002_phase2.sql`
4. Set up Supabase Storage:
   - Create bucket `capsules` (private)
   - Run `server/src/db/storage_policies_route_a.sql` in Supabase SQL Editor
5. Copy `.env.example` to `.env` and fill in values
6. `npm run server`

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

- **Storage Policies**: See `server/src/db/storage_policies_route_a.sql` for Supabase Storage RLS policies
- **Verification Queries**: See `server/src/db/verify/` for policy verification SQL queries

## Development

- `npm run server` - Start development server with hot reload
- `npm run server:build` - Build TypeScript to JavaScript
- `npm run server:start` - Start production server (after build)
