# Phase 3C: Release Gate Tests

Before deploying Phase 3C (Payments) to production, verify these 4 critical scenarios:

## ✅ Test 1: Happy Path
**Flow**: Pay → Return → Paid → Seal → Sealed

**Steps**:
1. Create capsule in Step 4
2. Go to Step 5
3. Click "Seal Capsule Now"
4. Complete payment in Stripe Checkout (use test card: `4242 4242 4242 4242`)
5. Return to app (should auto-redirect)
6. Verify: Payment status shows "Payment received ✅"
7. Verify: Automatically seals and navigates to Step 6 (Certificate)
8. Verify: Capsule state is `sealed` in database

**Expected Result**: ✅ Full flow works, no manual steps needed

---

## ✅ Test 2: Cancel Scenario
**Flow**: Cancel → Return → No Lock / Retry Works

**Steps**:
1. Create capsule in Step 4
2. Go to Step 5
3. Click "Seal Capsule Now"
4. In Stripe Checkout, click "Cancel" or close window
5. Return to app via cancel URL
6. Verify: Payment status shows "Not paid yet"
7. Verify: Capsule is editable again (can upload media, edit fields)
8. Verify: "Seal Capsule Now" button is visible and clickable
9. Verify: Can retry payment (click button again → new checkout session)

**Expected Result**: ✅ Clean cancel, capsule reset to draft, retry works

---

## ✅ Test 3: Refresh Mid-Flow
**Flow**: Refresh During Pending → UI Restores Correctly

**Steps**:
1. Create capsule in Step 4
2. Go to Step 5
3. Click "Seal Capsule Now"
4. Complete payment in Stripe Checkout
5. Return to app (polling starts)
6. **Before polling completes**: Refresh the page (F5)
7. Verify: Payment status shows "Processing..."
8. Verify: "Refresh Status" button is visible
9. Click "Refresh Status"
10. Verify: State updates correctly (either "Processing..." or "Payment received ✅")

**Expected Result**: ✅ UI restores correctly, no errors, state is accurate

---

## ✅ Test 4: Webhook Down Scenario
**Flow**: Webhook Down → Pay → Return → Pending → Later Webhook → Paid After Refresh

**Steps**:
1. **Stop Stripe webhook forwarding** (if using `stripe listen`)
2. Create capsule in Step 4
3. Go to Step 5
4. Click "Seal Capsule Now"
5. Complete payment in Stripe Checkout
6. Return to app
7. Verify: Polling starts, but state stays "pending_payment" (webhook not received)
8. Verify: After 45s timeout, shows "Still processing. Click refresh."
9. **Start webhook forwarding again** (or manually trigger webhook in Stripe Dashboard)
10. Click "Refresh Status"
11. Verify: State changes to "paid"
12. Verify: Automatically seals and navigates to Step 6

**Expected Result**: ✅ Graceful handling of webhook delay, user not stuck

---

## Additional Checks

### Payment Status Block
- ✅ Always visible in Step 5
- ✅ Shows correct status for each state:
  - Draft: "Not paid yet"
  - Pending: "Processing..." (with spinner if polling)
  - Paid: "Payment received ✅"
  - Sealed: "Sealed 🔒"

### Timeout UX
- ✅ After 45s polling: Shows "Still processing. Click refresh."
- ✅ "Refresh Status" button always available
- ✅ No infinite loading states

### Cancel Handling
- ✅ Cancel banner shown when `?payment=cancelled`
- ✅ Capsule reset to draft state
- ✅ Can retry payment immediately
- ✅ URL param cleared after reset

### Webhook Events
- ✅ `checkout.session.completed` → sets state to `paid`
- ✅ `checkout.session.async_payment_succeeded` → sets state to `paid`
- ✅ `checkout.session.async_payment_failed` → logged, state stays `pending_payment`
- ✅ Idempotency: duplicate webhooks don't cause errors

---

## Quick Test Commands

```bash
# Test backend endpoint
curl -X POST http://localhost:5001/api/payments/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"public_id":"YOUR_CAPSULE_UUID"}'

# Check webhook logs (if using stripe listen)
# Should see: "Checkout session completed for capsule {uuid}"

# Test reset endpoint
curl -X POST http://localhost:5001/api/capsules/YOUR_CAPSULE_UUID/reset-to-draft
```

---

## Deployment Checklist

- [ ] All 4 release gate tests pass
- [ ] Stripe webhook endpoint configured in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` set in production environment
- [ ] `FRONTEND_URL` set correctly (single URL, no commas)
- [ ] Test with real Stripe test mode
- [ ] Verify webhook delivery in Stripe Dashboard
- [ ] Monitor server logs for webhook events

---

**Status**: Ready for production after all tests pass ✅
