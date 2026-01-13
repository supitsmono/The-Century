# Phase 1 Testing Checklist

## Pre-Testing Setup

### 1. Environment Variables
Ensure `.env` has:
```
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe CLI)
```

### 2. Start Server
```bash
npm run server
```

### 3. Check Health
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"ok","timestamp":"..."}`

---

## Test 1: Database Migration ✅

### Run Migration
```bash
psql $DATABASE_URL -f server/src/db/migration_001_phase1.sql
```

### Verify in Database
Check that `capsules` table has:
- ✅ `public_id` column (UUID type)
- ✅ `open_at` column (TIMESTAMPTZ)
- ✅ `state` column (VARCHAR with CHECK constraint)
- ✅ Unique index on `public_id`
- ✅ `webhook_events` table exists

SQL to check:
```sql
\d capsules  -- PostgreSQL describe
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'capsules';
```

---

## Test 2: Capsule Creation ✅

### Request
```bash
curl -X POST http://localhost:5000/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "capsule": {
      "country": "Netherlands",
      "town": "Amsterdam",
      "dob": "1990-01-15",
      "message": "Test message",
      "photos": [],
      "ageAtCreation": 34,
      "openAt": "2125-01-01T00:00:00Z"
    },
    "email": "test@example.com"
  }'
```

### Expected Response
```json
{
  "public_id": "uuid-here",
  "message": "Capsule created successfully",
  "email": "test@example.com"
}
```

### Verify
- ✅ Response contains `public_id` (UUID format)
- ✅ No internal `id` in response
- ✅ Check database: `SELECT public_id, state FROM capsules WHERE public_id = '...'`
- ✅ State should be `'draft'`

**Save the `public_id` for next tests!**

---

## Test 3: State Machine Protection ⚠️

### Test 3a: Try to transition draft → paid (should fail)

There's no direct endpoint to set state, but we can test via `sealCapsule`:

```bash
# Try to seal a capsule that's still in 'draft' state (should fail)
curl -X POST http://localhost:5000/api/capsules/{public_id}/seal \
  -H "Content-Type: application/json"
```

**Expected**: 400 error: `"Invalid state transition: draft → sealed"`

### Test 3b: Try to seal without payment (should fail)

1. Create capsule (state: draft)
2. Try to seal directly without going through payment:
```bash
curl -X POST http://localhost:5000/api/capsules/{public_id}/seal
```

**Expected**: 400 error: `"Invalid state transition: draft → sealed"`

✅ State machine prevents invalid transitions

---

## Test 4: Payment Intent Creation ⚠️

### Flow Note
The current implementation requires:
1. Create capsule (state: `draft`)
2. Initiate payment: `POST /api/capsules/{public_id}/initiate-payment` (state: `pending_payment`)
3. Create payment intent: `POST /api/payments/create-intent`

### Step 1: Initiate Payment
```bash
curl -X POST http://localhost:5000/api/capsules/{public_id}/initiate-payment \
  -H "Content-Type: application/json"
```

Expected: State changes to `pending_payment`

### Step 2: Create Payment Intent
```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "public_id": "your-public-id-here",
    "amount": 2999,
    "currency": "eur"
  }'
```

### Expected Response
```json
{
  "client_secret": "pi_..._secret_...",
  "payment_intent_id": "pi_...",
  "amount": 2999,
  "currency": "eur"
}
```

### Verify
- ✅ Response contains `client_secret`
- ✅ Check database: capsule state is `pending_payment`
- ✅ Payment intent ID is stored in Stripe dashboard

---

## Test 5: Webhook Handling (CRITICAL) ⚠️

### Setup Stripe CLI
```bash
# Install Stripe CLI if not installed
# macOS: brew install stripe/stripe-cli/stripe
# Other: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Start listening (in separate terminal)
stripe listen --forward-to localhost:5000/api/payments/webhook
```

**Copy the `whsec_...` secret and update `.env` STRIPE_WEBHOOK_SECRET**

### Test 5a: Webhook Success
```bash
# In another terminal
stripe trigger payment_intent.succeeded
```

**Expected**:
- ✅ Backend logs: "Payment succeeded for capsule {public_id}"
- ✅ Database: capsule state = `paid`
- ✅ Database: `webhook_events` table has entry with stripe_event_id
- ✅ Database: capsule.payment_id is set

### Test 5b: Idempotency (Duplicate Event)
```bash
# Trigger same event again
stripe trigger payment_intent.succeeded
```

**Expected**:
- ✅ Backend logs: "Webhook event {id} already processed, skipping"
- ✅ No duplicate state updates
- ✅ Response: `{"received": true, "idempotent": true}`

### Test 5c: Signature Verification Failure
1. Stop `stripe listen`
2. Change `STRIPE_WEBHOOK_SECRET` in `.env` to wrong value
3. Trigger event again (will fail, but that's expected)

**Expected**: 400 error: "Webhook signature verification failed"

### Test 5d: Invalid Webhook (Wrong Event Type)
```bash
stripe trigger payment_intent.payment_failed
```

**Expected**: 
- ✅ Event is processed (logged but state doesn't change)
- ✅ Capsule stays in `pending_payment` state

---

## Test 6: Rate Limiting ✅

### Test 6a: Capsule Creation Limit
```bash
# Spam 11 requests quickly
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/capsules \
    -H "Content-Type: application/json" \
    -d '{
      "capsule": {
        "country": "Test",
        "town": "Test",
        "dob": "1990-01-01",
        "message": "Test",
        "photos": [],
        "ageAtCreation": 34,
        "openAt": "2125-01-01T00:00:00Z"
      }
    }'
  echo ""
done
```

**Expected**: 
- ✅ Requests 1-10: Success (200/201)
- ✅ Request 11: 429 Too Many Requests

### Test 6b: Payment Intent Limit
```bash
# Create 21 payment intents (need valid public_id and state)
# This is harder to test, but rate limiter should block after 20
```

**Expected**: Request 21 should return 429

---

## Known Issues & Fixes Needed

### Issue 1: Payment Flow
The payment flow requires two steps:
1. `initiatePayment` to set state to `pending_payment`
2. `createPaymentIntent` to create Stripe intent

**This is by design** - state machine ensures proper flow.

### Issue 2: Webhook Testing
Webhook testing requires Stripe CLI. For production, use Stripe dashboard webhook configuration.

### Issue 3: State Machine Testing
There's no "hack" endpoint to test state transitions - this is GOOD (security). Test via normal flow or create test endpoint for development only.

---

## Summary Checklist

- [ ] Database migration runs successfully
- [ ] Capsule creation returns public_id (UUID)
- [ ] State machine prevents invalid transitions
- [ ] Payment intent creation works
- [ ] Webhook processes payment correctly
- [ ] Idempotency prevents duplicate processing
- [ ] Rate limiting blocks excessive requests
- [ ] No internal IDs leaked in API responses

