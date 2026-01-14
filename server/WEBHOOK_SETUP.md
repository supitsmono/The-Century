# Webhook Setup & Testing Guide

## Stap 1: Installeer Stripe CLI

### Optie 1: Met Homebrew (Aanbevolen)
```bash
brew install stripe/stripe-cli/stripe
```

### Optie 2: Download van GitHub
1. Ga naar: https://github.com/stripe/stripe-cli/releases/latest
2. Download voor jouw OS
3. Extract en verplaats naar een locatie in je PATH

### Optie 3: Via npm
```bash
npm install -g @stripe/stripe-cli
```

### Login
```bash
stripe login
```

Dit opent je browser voor authenticatie.

---

## Stap 2: Start Webhook Forwarding

In een terminal:

```bash
stripe listen --forward-to localhost:5001/api/payments/webhook
```

Je ziet output zoals:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Kopieer het `whsec_...` secret!**

---

## Stap 3: Zet Webhook Secret in .env

Open `server/.env` en voeg toe/update:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Herstart de server:**
```bash
# Stop huidige server (Ctrl+C)
npm run server
```

---

## Stap 4: Test Webhooks

### 1. Maak capsule en payment intent

```bash
# Create capsule
PUBLIC_ID=$(curl -s -X POST http://localhost:5001/api/capsules \
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
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['public_id'])")

# Initiate payment
curl -X POST http://localhost:5001/api/capsules/$PUBLIC_ID/initiate-payment

# Create payment intent
INTENT_RESPONSE=$(curl -s -X POST http://localhost:5001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"public_id\": \"$PUBLIC_ID\",
    \"amount\": 2999,
    \"currency\": \"eur\"
  }")

PAYMENT_INTENT_ID=$(echo $INTENT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['payment_intent_id'])")

echo "Payment Intent ID: $PAYMENT_INTENT_ID"
```

### 2. Trigger webhook

**Via Stripe CLI:**
```bash
stripe trigger payment_intent.succeeded
```

**Of via Stripe Dashboard:**
- Ga naar https://dashboard.stripe.com/test/payments
- Zoek payment intent: `pi_...`
- Klik "Send test webhook" → "payment_intent.succeeded"

### 3. Check server logs

Je zou moeten zien:
```
Payment succeeded for capsule {public_id}
```

### 4. Verify in database

```sql
-- Check capsule state
SELECT public_id, state, payment_id 
FROM capsules 
WHERE public_id = 'jouw-public-id';

-- Check webhook event
SELECT * FROM webhook_events 
WHERE capsule_id = (SELECT id FROM capsules WHERE public_id = 'jouw-public-id');
```

**Verwacht:**
- ✅ Capsule state = `'paid'`
- ✅ `payment_id` is gezet
- ✅ Webhook event in `webhook_events` table

---

## Test A: Webhook Verification ✅

### Test
1. Trigger webhook: `stripe events resend $PAYMENT_INTENT_ID`
2. Check server logs

### Verwacht
- ✅ Server logs: "Payment succeeded for capsule {public_id}"
- ✅ Geen errors over signature verification
- ✅ Capsule state: `pending_payment` → `paid`

### Als het faalt
- Check of `STRIPE_WEBHOOK_SECRET` correct is in `.env`
- Check of webhook forwarding draait
- Check server logs voor errors

---

## Test B: Idempotency ✅

### Test
1. Trigger **dezelfde** webhook opnieuw:
   ```bash
   stripe events resend $PAYMENT_INTENT_ID
   ```
2. Check server logs

### Verwacht
- ✅ Server logs: "Webhook event {id} already processed, skipping"
- ✅ Response: `{"received": true, "idempotent": true}`
- ✅ Capsule state blijft `paid` (niet opnieuw geupdate)
- ✅ Geen duplicate entries in database

### Verify in database
```sql
SELECT COUNT(*) FROM webhook_events 
WHERE stripe_event_id = 'evt_...';
```

Moet 1 zijn (niet 2).

---

## Test C: Rate Limiting ✅

### Test Capsule Creation (11 requests)

```bash
for i in {1..11}; do
  curl -X POST http://localhost:5001/api/capsules \
    -H "Content-Type: application/json" \
    -d "{
      \"capsule\": {
        \"country\": \"Test\",
        \"town\": \"Test\",
        \"dob\": \"1990-01-01\",
        \"message\": \"Test $i\",
        \"photos\": [],
        \"ageAtCreation\": 34,
        \"openAt\": \"2125-01-01T00:00:00Z\"
      }
    }" \
    -w "\nHTTP: %{http_code}\n"
  sleep 0.1
done
```

### Verwacht
- ✅ Requests 1-10: HTTP 201 (success)
- ✅ Request 11: HTTP 429 (Too Many Requests)
- ✅ Error message: "Too many capsule creation attempts"

### Test Payment Intents (21 requests)

```bash
# Eerst capsule + initiate payment
PUBLIC_ID=$(curl -s -X POST http://localhost:5001/api/capsules \
  -H "Content-Type: application/json" \
  -d '{"capsule":{"country":"Test","town":"Test","dob":"1990-01-01","message":"Test","photos":[],"ageAtCreation":34,"openAt":"2125-01-01T00:00:00Z"}}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['public_id'])")

curl -X POST http://localhost:5001/api/capsules/$PUBLIC_ID/initiate-payment

# Dan 21 payment intent requests
for i in {1..21}; do
  curl -X POST http://localhost:5001/api/payments/create-intent \
    -H "Content-Type: application/json" \
    -d "{
      \"public_id\": \"$PUBLIC_ID\",
      \"amount\": 2999,
      \"currency\": \"eur\"
    }" \
    -w "\nHTTP: %{http_code}\n"
  sleep 0.1
done
```

### Verwacht
- ✅ Requests 1-20: HTTP 200 (success)
- ✅ Request 21: HTTP 429 (Too Many Requests)

---

## Troubleshooting

### Webhook niet ontvangen
- Check of `stripe listen` draait
- Check of webhook URL correct is: `localhost:5001/api/payments/webhook`
- Check server logs voor errors

### Signature verification failed
- Check of `STRIPE_WEBHOOK_SECRET` correct is
- Check of je de secret van `stripe listen` gebruikt (niet van dashboard)
- Herstart server na .env update

### Payment intent niet gevonden in webhook
- Check of payment intent metadata `capsule_public_id` bevat
- Check server logs voor "Payment intent missing capsule_public_id metadata"

### Rate limiting werkt niet
- Check of `express-rate-limit` geïnstalleerd is
- Check server logs voor errors
- Verify rate limiter configuratie

---

## ✅ Complete Test Checklist

- [ ] Stripe CLI geïnstalleerd en gelogd in
- [ ] Webhook forwarding draait (`stripe listen`)
- [ ] `STRIPE_WEBHOOK_SECRET` in `.env` gezet
- [ ] Server herstart na .env update
- [ ] Webhook verification werkt (signature check)
- [ ] Payment intent → capsule state update werkt
- [ ] Idempotency werkt (duplicate events = no-op)
- [ ] Rate limiting werkt (11 capsules = geblokkeerd)
- [ ] Rate limiting werkt (21 payment intents = geblokkeerd)

**Als alles groen is: Je bent klaar voor live! 🎉**
