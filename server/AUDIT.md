# Backend Audit - Current Issues

## Critical Issues (Must Fix)

### 1. No State Machine
**Problem**: Capsules can transition to any payment_status without validation
- Capsule can become "paid" without actual payment verification
- No enforcement of state transitions
- Risk: Users can mark capsules as paid without paying

**Fix**: Implement state machine: `draft → pending_payment → paid → sealed`
- Add state validation in controllers
- Block invalid transitions
- Only allow "paid" via webhook confirmation

### 2. No Payment Verification
**Problem**: Payment routes are placeholders
- No Stripe integration
- No webhook signature verification
- No idempotency for webhook events
- Risk: Payment fraud, duplicate processing

**Fix**: Implement Stripe webhooks with signature verification + idempotency

### 3. Predictable IDs
**Problem**: Using SERIAL PRIMARY KEY exposed in API
- IDs are predictable (1, 2, 3...)
- Users can enumerate and access other capsules
- Risk: Privacy breach

**Fix**: Add `public_id` (UUID) field, use in API, keep `id` as internal

### 4. No Input Validation
**Problem**: Basic JavaScript checks only
- No type validation
- No size limits enforced
- No schema validation
- Risk: Invalid data in database, security issues

**Fix**: Use Zod for all input validation

### 5. Database Schema Issues
**Problems**:
- `archival_year/month/day/time` stored separately (should be TIMESTAMPTZ)
- `payment_status` has no CHECK constraint (can be invalid values)
- No unique constraint on public_id (will add)
- Missing indexes

**Fix**: 
- Replace with `open_at TIMESTAMPTZ`
- Add CHECK constraint for payment_status
- Add public_id field with unique index

### 6. No Rate Limiting
**Problem**: No protection against abuse
- Unlimited capsule creation
- No protection against spam/DoS
- Risk: Server overload, abuse

**Fix**: Add rate limiting middleware

### 7. CORS Configuration
**Problem**: Hardcoded to localhost:3000
- Not environment-based
- Risk: CORS issues in production

**Fix**: Use environment variable

## Medium Priority Issues

### 8. Error Handling
**Current**: Basic error handler exists
**Issue**: Could be more specific for different error types
**Status**: OK for now, can improve later

### 9. Media Storage
**Problem**: Base64 in database (will fix in Phase 2)
**Status**: Known issue, deferred to Phase 2 (Supabase Storage)

## Files That Need Changes

### Database
- `server/src/db/schema.sql` - Add public_id, fix timestamps, add constraints

### Controllers
- `server/src/controllers/capsuleController.ts` - State machine, public_id, validation

### Routes
- `server/src/routes/capsules.ts` - Update to use public_id
- `server/src/routes/payments.ts` - Implement Stripe integration

### Middleware
- `server/src/middleware/errorHandler.ts` - Already OK
- NEW: `server/src/middleware/rateLimiter.ts` - Rate limiting
- NEW: `server/src/middleware/stateMachine.ts` - State validation (or in controller)

### Types
- `server/src/types/capsule.ts` - Add public_id, state types

### Validation
- NEW: `server/src/validation/capsuleSchemas.ts` - Zod schemas

### Services (optional, or inline)
- NEW: `server/src/services/stripeService.ts` - Stripe logic (or inline in controller)

## Implementation Order (Phase 1)

1. Database schema updates (migration)
2. Types update
3. Zod validation schemas
4. State machine logic
5. Public ID generation
6. Controllers refactor
7. Stripe integration
8. Rate limiting
9. Routes update
10. Testing

