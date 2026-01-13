# Backend Server

Express.js backend server for The Century time capsule application.

## Quick Start

See [PHASE1_SETUP.md](./PHASE1_SETUP.md) for detailed setup instructions.

**Quick setup:**
1. `npm install`
2. Set up PostgreSQL database
3. Run migration: `psql $DATABASE_URL -f server/src/db/migration_001_phase1.sql`
4. Copy `.env.example` to `.env` and fill in values
5. `npm run server`

The server runs on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /health` - Server health check

### Capsules
- `POST /api/capsules` - Create a new capsule
- `GET /api/capsules/:id` - Get a capsule by ID
- `PATCH /api/capsules/:id/payment` - Update capsule payment status

### Payments (Placeholder)
- `POST /api/payments/webhook` - Payment webhook handler
- `POST /api/payments/create-intent` - Create payment intent

### Emails (Placeholder)
- `POST /api/emails/send-certificate` - Send certificate email

## Database Schema

See `server/src/db/schema.sql` for the database schema.

## Development

- `npm run server` - Start development server with hot reload
- `npm run server:build` - Build TypeScript to JavaScript
- `npm run server:start` - Start production server (after build)
