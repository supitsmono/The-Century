# Quick Test Guide - Phase 1

## Prerequisites
- Database migrated
- `.env` configured with Stripe keys
- Server running: `npm run server`

## 1. Health Check ✅
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"ok",...}`

## 2. Create Capsule ✅
```bash
curl -X POST http://localhost:5000/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "capsule": {
      "country": "Netherlands",
      "town": "Amsterdam",
      "dob": "1990-01-15",
      "message": "Test",
      "photos": [],
      "ageAtCreation": 34,
      "openAt": "2125-01-01T00:00:00Z"
    }
  }'
```

Save the `public_id` from response!

## 3. State Machine Test ✅
```bash
# Try to seal a draft capsule (should fail)
curl -X POST http://localhost:5000/api/capsules/{public_id}/seal
```
Expected: 400 error about invalid transition

## 4. Payment Flow ✅
```bash
# Step 1: Initiate payment
curl -X POST http://localhost:5000/api/capsules/{public_id}/initiate-payment

# Step 2: Create payment intent
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{"public_id":"{public_id}","amount":2999,"currency":"eur"}'
```

## 5. Webhook Test (requires Stripe CLI)
```bash
# Terminal 1: Start webhook listener
stripe listen --forward-to localhost:5000/api/payments/webhook
# Copy the whsec_... secret to .env

# Terminal 2: Trigger test event
stripe trigger payment_intent.succeeded
```

Check database: capsule state should be `paid`

## 6. Rate Limiting ✅
```bash
# Spam 11 requests
for i in {1..11}; do curl -X POST http://localhost:5000/api/capsules -H "Content-Type: application/json" -d '{"capsule":{"country":"T","town":"T","dob":"1990-01-01","message":"T","photos":[],"ageAtCreation":34,"openAt":"2125-01-01T00:00:00Z"}}'; echo ""; done
```
Request 11 should return 429.

