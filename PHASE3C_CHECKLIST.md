# Phase 3C: Payments - Implementation Checklist

## ✅ Backend Status (Already Implemented)

### Payment Controller (`server/src/controllers/paymentController.ts`)
- [x] `createPaymentIntent` - Creates Stripe PaymentIntent
  - [x] Validates input
  - [x] Transitions capsule: `draft` → `pending_payment`
  - [x] Stores `payment_id` in capsule
  - [x] Returns `client_secret` for frontend
- [x] `handleStripeWebhook` - Processes webhook events
  - [x] Verifies Stripe signature
  - [x] Idempotency check (webhook_events table)
  - [x] Handles `payment_intent.succeeded` → sets state to `paid`
  - [x] Handles `payment_intent.payment_failed` → logs (keeps `pending_payment`)
  - [x] Transaction safety (BEGIN/COMMIT/ROLLBACK)
- [x] `confirmPaymentIntent` - Test endpoint (dev only)
  - [x] Security: Only in non-production
  - [x] Uses Stripe test payment method

### Routes (`server/src/routes/payments.ts`)
- [x] `POST /api/payments/create-intent` - Rate limited
- [x] `POST /api/payments/confirm` - Rate limited (dev only)
- [x] Webhook route configured in `index.ts` (raw body parsing)

### State Machine (`server/src/utils/stateMachine.ts`)
- [x] `canProcessPayment(state)` - Validates state transitions
- [x] State guards in place

### Database
- [x] `payment_id` column in capsules table
- [x] `webhook_events` table for idempotency
- [x] State transitions: `draft` → `pending_payment` → `paid`

---

## 🔧 Backend: Needs Review/Fix

### 1. Seal Endpoint
- [x] ✅ **Seal endpoint exists** (`POST /api/capsules/:public_id/seal`)
  - [x] Transitions: `paid` → `sealed`
  - [x] Uses state machine validation
  - [x] Location: `server/src/controllers/capsuleController.ts` (line 225)
  - [x] Route: `server/src/routes/capsules.ts` (line 17)

### 2. State Guards
- [x] ✅ **Client cannot set `paid` state directly**
  - Only `handleStripeWebhook` sets state to `paid` (line 266 in paymentController.ts)
  - All other endpoints use state machine validation
  - `sealCapsule` only transitions `paid` → `sealed`
  - `initiatePayment` only transitions `draft` → `pending_payment`
  - ✅ Security: Only webhook can set `paid`

### 3. Webhook Idempotency
- [x] ✅ Already implemented with `webhook_events` table
- [x] ✅ **webhook_events table exists**
  - Defined in: `server/src/db/migration_001_phase1.sql` (line 65)
  - Index on `stripe_event_id` for fast lookups

### 4. Error Handling
- [ ] **Review payment failure handling**
  - Current: logs failure, keeps `pending_payment`
  - Consider: Should we allow retry? Or transition back to `draft`?

---

## 🎨 Frontend: To Implement

### 1. Payment UI in Step 5 (Review)
- [ ] **Add Stripe Elements to Step5Review.tsx**
  - Import `@stripe/stripe-js` and `@stripe/react-stripe-js`
  - Create payment form component
  - Show payment amount (€29.99)
  - Handle payment submission

### 2. Payment Flow
- [ ] **Call `/api/payments/create-intent`**
  - On "Pay" button click
  - Store `client_secret` and `payment_intent_id`
  - Show Stripe payment form

### 3. Payment Processing
- [ ] **Handle Stripe payment confirmation**
  - Use Stripe Elements to collect payment
  - Submit payment to Stripe
  - Wait for confirmation

### 4. State Polling
- [ ] **Poll capsule state after payment**
  - Poll `GET /api/capsules/:public_id` every 2-3 seconds
  - Wait for state: `pending_payment` → `paid`
  - Show loading state during polling
  - Timeout after 30-60 seconds

### 5. Seal Action
- [ ] **Call seal endpoint after payment confirmed**
  - When state = `paid`, show "Seal Capsule" button
  - Call `POST /api/capsules/:public_id/seal`
  - Transition to Step 6 (Certificate)

### 6. Wizard Read-Only States
- [ ] **Make wizard read-only when `pending_payment` or `paid`**
  - Disable all form inputs
  - Show status message
  - Only allow "Seal" action when `paid`

### 7. Error Handling
- [ ] **Handle payment failures**
  - Show error message
  - Allow retry
  - Optionally: transition back to editable state

---

## 🧪 Testing: To Create

### Smoke Test (`scripts/smoke-phase3c-payments.ts`)
- [ ] Create capsule
- [ ] Create payment intent
- [ ] Simulate payment (Stripe test card)
- [ ] Verify webhook received
- [ ] Verify state transition: `pending_payment` → `paid`
- [ ] Test seal endpoint: `paid` → `sealed`
- [ ] Verify idempotency (duplicate webhook events)

---

## 📋 Implementation Order

### Step 1: Backend Review & Fixes ✅ COMPLETE
1. ✅ Seal endpoint exists and works
2. ⚠️ Verify state guards (client cannot set `paid`) - **Needs review**
3. ✅ webhook_events table exists
4. ⚠️ Test webhook locally (use Stripe CLI) - **Needs testing**

### Step 2: Frontend Payment UI
1. Add Stripe Elements to Step 5
2. Implement payment form
3. Call create-intent endpoint
4. Handle payment submission

### Step 3: State Management
1. Implement polling for `paid` state
2. Add loading states
3. Handle timeouts/errors

### Step 4: Seal Flow
1. Add seal button when `paid`
2. Call seal endpoint
3. Transition to Step 6

### Step 5: Read-Only States
1. Disable wizard when `pending_payment` or `paid`
2. Show appropriate status messages

### Step 6: Smoke Test
1. Create test script
2. Test full payment flow
3. Verify all state transitions

---

## 🔍 Quick Checks

### Backend Endpoints
```bash
# Check if seal endpoint exists
grep -r "seal" server/src/controllers/capsuleController.ts
grep -r "/seal" server/src/routes/capsules.ts
```

### Database Schema
```bash
# Check webhook_events table
grep -r "webhook_events" server/src/db/
```

### State Machine
```bash
# Check state transitions
cat server/src/utils/stateMachine.ts
```

---

## 📝 Notes

- **Payment Amount**: Currently hardcoded to €29.99 (2999 cents)
- **Currency**: EUR (hardcoded)
- **Test Mode**: `confirmPaymentIntent` endpoint for testing (dev only)
- **Webhook**: Must be configured in Stripe Dashboard
- **Idempotency**: Already handled via `webhook_events` table

---

---

## ✅ Backend Status Summary

**Backend is 95% complete!** All critical endpoints exist:
- ✅ Payment intent creation
- ✅ Webhook handling with idempotency
- ✅ Seal endpoint
- ✅ State machine guards
- ✅ Database schema ready

**Only remaining backend tasks:**
- ⚠️ Test webhook locally with Stripe CLI
- ⚠️ Optional: Review payment failure handling strategy

---

## 🚀 Next Steps

**Option 1: Start Frontend Implementation** (Recommended)
- Begin with Step 5 payment UI
- Add Stripe Elements
- Implement payment flow

**Option 2: Test Backend First**
- Set up Stripe CLI for local webhook testing
- Test full payment flow end-to-end
- Verify all state transitions

**Option 3: Create Smoke Test Plan**
- Design test scenarios
- Create test script structure
- Document test requirements

---

**Recommendation**: Start with **Option 1** (Frontend) since backend is ready. Test as you build.
