# Smoke Tests - Pre-Launch Checklist

**Doel**: Verifieer dat alle kritieke paden werken voordat je live gaat.

**Tijd**: 30-60 minuten

**BELANGRIJK**: Test met **LIVE** Stripe keys en **PRODUCTION** database!

---

## ⚠️ Voorbereiding

### 1. Environment Setup
Zorg dat je `.env` heeft:
```env
DATABASE_URL=postgresql://...  # Production database
STRIPE_SECRET_KEY=sk_live_...  # LIVE key, niet test!
STRIPE_WEBHOOK_SECRET=whsec_...  # Van Stripe dashboard
FRONTEND_URL=https://jouw-frontend.vercel.app
NODE_ENV=production
```

### 2. Server draait
```bash
npm run server
# Of in production: check of server online is
```

### 3. Test tools
- `curl` of Postman
- Stripe dashboard open
- Database access (Supabase dashboard of `psql`)

---

## ✅ Test 1: Database Migratie (5 min)

### 1.1 Run migratie
```bash
psql $DATABASE_URL -f server/src/db/migration_001_phase1.sql
```

**Verwacht**: Geen errors

### 1.2 Verify constraints
```sql
-- Connect to database
psql $DATABASE_URL

-- Check columns
\d capsules

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'capsules'::regclass;

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'capsules';
```

**Verwacht**:
- ✅ `public_id` column (UUID, NOT NULL, UNIQUE)
- ✅ `state` column (VARCHAR, CHECK constraint: draft/pending_payment/paid/sealed)
- ✅ `open_at` column (TIMESTAMPTZ)
- ✅ `webhook_events` table exists
- ✅ Index op `public_id`
- ✅ Index op `state`

### 1.3 Test public_id auto-generation
```sql
-- Insert test row (zonder public_id)
INSERT INTO capsules (country, town, dob, message, age_at_creation, open_at, state)
VALUES ('Test', 'Test', '1990-01-01', 'Test', 34, '2125-01-01 00:00:00+00', 'draft')
RETURNING public_id;
```

**Verwacht**: 
- ✅ `public_id` wordt automatisch gegenereerd (UUID format)
- ✅ Geen NULL values

**Cleanup**:
```sql
DELETE FROM capsules WHERE country = 'Test';
```

---

## ✅ Test 2: Capsule Creation (5 min)

### 2.1 Create capsule
```bash
curl -X POST https://jouw-server.vercel.app/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "capsule": {
      "country": "Netherlands",
      "town": "Amsterdam",
      "dob": "1990-01-15",
      "message": "Test message for smoke test",
      "photos": [],
      "ageAtCreation": 34,
      "openAt": "2125-01-01T00:00:00Z"
    },
    "email": "test@example.com"
  }'
```

**Verwacht response**:
```json
{
  "public_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Capsule created successfully",
  "email": "test@example.com"
}
```

**Verificaties**:
- ✅ Response bevat `public_id` (UUID format)
- ✅ Geen `id` (internal) in response
- ✅ Status code: 201

### 2.2 Verify in database
```sql
SELECT public_id, state, open_at, created_at 
FROM capsules 
WHERE public_id = 'jouw-public-id-hier';
```

**Verwacht**:
- ✅ `state` = `'draft'` (default)
- ✅ `open_at` = `2125-01-01 00:00:00+00` (TIMESTAMPTZ)
- ✅ `public_id` is UUID format

**Sla `public_id` op voor volgende tests!**

---

## ✅ Test 3: State Machine Hard Check (10 min)

### 3.1 Test illegale transition: draft → paid
```bash
# Probeer direct naar 'paid' te gaan (zou moeten falen)
# Er is geen direct endpoint, maar test via seal endpoint:

PUBLIC_ID="jouw-public-id-hier"

curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/seal \
  -H "Content-Type: application/json"
```

**Verwacht**:
- ✅ Status code: 400
- ✅ Error message: `"Invalid state transition: draft → sealed"`
- ✅ Capsule blijft in `draft` state

### 3.2 Test sealed zonder paid
```bash
# 1. Create capsule (state: draft)
PUBLIC_ID=$(curl -X POST https://jouw-server.vercel.app/api/capsules \
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
  }' | jq -r '.public_id')

# 2. Probeer te sealen zonder payment
curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/seal
```

**Verwacht**:
- ✅ Status code: 400
- ✅ Error: `"Invalid state transition: draft → sealed"`
- ✅ State machine blokkeert illegale transitions

### 3.3 Test correcte flow
```bash
# 1. Create capsule
PUBLIC_ID=$(curl -X POST https://jouw-server.vercel.app/api/capsules \
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
  }' | jq -r '.public_id')

# 2. Initiate payment (draft → pending_payment)
curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/initiate-payment

# 3. Verify state
curl https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID | jq '.state'
```

**Verwacht**:
- ✅ State = `"pending_payment"`

---

## ✅ Test 4: Stripe Intent (10 min)

### 4.1 Create payment intent
```bash
PUBLIC_ID="jouw-public-id-hier"  # Van test 2 of 3

# Zorg dat capsule in 'pending_payment' state is
curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/initiate-payment

# Create intent
curl -X POST https://jouw-server.vercel.app/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"public_id\": \"$PUBLIC_ID\",
    \"amount\": 2999,
    \"currency\": \"eur\"
  }"
```

**Verwacht response**:
```json
{
  "client_secret": "pi_..._secret_...",
  "payment_intent_id": "pi_...",
  "amount": 2999,
  "currency": "eur"
}
```

**Verificaties**:
- ✅ `client_secret` aanwezig
- ✅ `payment_intent_id` aanwezig
- ✅ Status code: 200

### 4.2 Verify in Stripe dashboard
1. Ga naar Stripe dashboard → **Payments** → **Payment Intents**
2. Zoek naar `payment_intent_id` uit response
3. Check **Metadata**:
   - ✅ `capsule_public_id` = jouw public_id
   - ✅ `capsule_internal_id` = internal ID (niet null)

### 4.3 Test met verkeerde state
```bash
# Create capsule (state: draft)
PUBLIC_ID=$(curl -X POST https://jouw-server.vercel.app/api/capsules \
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
  }' | jq -r '.public_id')

# Probeer payment intent te maken (zonder initiate-payment)
curl -X POST https://jouw-server.vercel.app/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"public_id\": \"$PUBLIC_ID\",
    \"amount\": 2999,
    \"currency\": \"eur\"
  }"
```

**Verwacht**:
- ✅ Status code: 400
- ✅ Error: `"Capsule is in draft state and cannot process payment"`

---

## ✅ Test 5: Webhook Verification (15 min)

### 5.1 Setup webhook in Stripe
1. Ga naar Stripe dashboard → **Developers** → **Webhooks**
2. Check of endpoint bestaat: `https://jouw-server.vercel.app/api/payments/webhook`
3. Check of events correct zijn: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Kopieer **Signing secret** → update `.env` `STRIPE_WEBHOOK_SECRET`

### 5.2 Test webhook met juiste signature
```bash
# 1. Create capsule en payment intent
PUBLIC_ID=$(curl -X POST https://jouw-server.vercel.app/api/capsules \
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
  }' | jq -r '.public_id')

curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/initiate-payment

INTENT_RESPONSE=$(curl -X POST https://jouw-server.vercel.app/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d "{
    \"public_id\": \"$PUBLIC_ID\",
    \"amount\": 2999,
    \"currency\": \"eur\"
  }")

PAYMENT_INTENT_ID=$(echo $INTENT_RESPONSE | jq -r '.payment_intent_id')

# 2. Simuleer payment in Stripe dashboard
# Ga naar Stripe dashboard → Payments → Payment Intents
# Klik op payment intent → "Send test webhook" → "payment_intent.succeeded"
# OF gebruik Stripe CLI:
# stripe trigger payment_intent.succeeded --override payment_intent:metadata.capsule_public_id=$PUBLIC_ID
```

**Verwacht**:
- ✅ Webhook wordt ontvangen door server
- ✅ Server logs: "Payment succeeded for capsule {public_id}"
- ✅ Database: capsule state = `'paid'`
- ✅ Database: `payment_id` is gezet
- ✅ Database: `webhook_events` heeft entry

**Verify in database**:
```sql
SELECT state, payment_id 
FROM capsules 
WHERE public_id = 'jouw-public-id-hier';

SELECT * FROM webhook_events 
WHERE capsule_id = (SELECT id FROM capsules WHERE public_id = 'jouw-public-id-hier');
```

### 5.3 Test idempotency (duplicate event)
```bash
# Stuur zelfde webhook event opnieuw
# In Stripe dashboard: "Send test webhook" → zelfde event
# OF: stripe trigger payment_intent.succeeded (met zelfde metadata)
```

**Verwacht**:
- ✅ Server logs: "Webhook event {id} already processed, skipping"
- ✅ Response: `{"received": true, "idempotent": true}`
- ✅ Geen duplicate state updates
- ✅ Capsule blijft in `paid` state (niet opnieuw geupdate)

**Verify in database**:
```sql
-- Check dat er maar 1 webhook event is (of meerdere maar zelfde stripe_event_id)
SELECT COUNT(*) FROM webhook_events 
WHERE stripe_event_id = 'evt_...';
```

### 5.4 Test webhook zonder geldige signature
```bash
# 1. Verander STRIPE_WEBHOOK_SECRET naar verkeerde waarde
# 2. Stuur webhook opnieuw
```

**Verwacht**:
- ✅ Status code: 400
- ✅ Error: `"Webhook signature verification failed"`
- ✅ Webhook wordt **NIET** verwerkt
- ✅ Capsule state blijft ongewijzigd

---

## ✅ Test 6: Rate Limiting (10 min)

### 6.1 Test capsule creation limit (11 requests)
```bash
# Spam 11 requests snel achter elkaar
for i in {1..11}; do
  echo "Request $i:"
  curl -X POST https://jouw-server.vercel.app/api/capsules \
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
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.1
done
```

**Verwacht**:
- ✅ Requests 1-10: Status 201 (success)
- ✅ Request 11: Status 429 (Too Many Requests)
- ✅ Error message: "Too many capsule creation attempts, please try again later."

### 6.2 Test payment intent limit (21 requests)
```bash
# Create capsule en initiate payment
PUBLIC_ID=$(curl -X POST https://jouw-server.vercel.app/api/capsules \
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
  }' | jq -r '.public_id')

curl -X POST https://jouw-server.vercel.app/api/capsules/$PUBLIC_ID/initiate-payment

# Spam 21 payment intent requests
for i in {1..21}; do
  echo "Request $i:"
  curl -X POST https://jouw-server.vercel.app/api/payments/create-intent \
    -H "Content-Type: application/json" \
    -d "{
      \"public_id\": \"$PUBLIC_ID\",
      \"amount\": 2999,
      \"currency\": \"eur\"
    }" \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.1
done
```

**Verwacht**:
- ✅ Requests 1-20: Status 200 (success)
- ✅ Request 21: Status 429 (Too Many Requests)
- ✅ Error message: "Too many payment requests, please try again later."

---

## 📊 Test Summary Checklist

Na alle tests, check:

- [ ] **Database migratie**: Constraints en indices aanwezig
- [ ] **Capsule creation**: Krijgt `public_id`, default state = `draft`
- [ ] **open_at**: Wordt correct opgeslagen als TIMESTAMPTZ
- [ ] **State machine**: Blokkeert illegale transitions
- [ ] **Payment intent**: Wordt aangemaakt, linkt aan capsule
- [ ] **Webhook verification**: Werkt met juiste signature
- [ ] **Webhook processing**: Zet status naar `paid`
- [ ] **Idempotency**: Duplicate events = no-op
- [ ] **Webhook security**: Verkeerde signature = reject
- [ ] **Rate limiting**: Capsule creation (11×) = geblokkeerd
- [ ] **Rate limiting**: Payment intents (21×) = geblokkeerd

---

## 🚨 Als tests falen

### Database errors
- Check connection string
- Check of migratie volledig is uitgevoerd
- Check Supabase firewall settings

### Stripe errors
- Check of je **LIVE** keys gebruikt (niet test!)
- Check of webhook endpoint correct is
- Check Stripe dashboard voor error details

### Rate limiting werkt niet
- Check of `express-rate-limit` geïnstalleerd is
- Check server logs voor errors
- Verify dat middleware correct is geconfigureerd

### Webhook niet ontvangen
- Check of webhook URL correct is in Stripe dashboard
- Check server logs
- Test met Stripe CLI eerst: `stripe listen --forward-to ...`

---

## ✅ Als alles groen is

**Je bent klaar om live te gaan! 🎉**

Volgende stappen:
1. Deploy frontend
2. Test end-to-end flow
3. Monitor eerste echte payments
4. Start Phase 2 (Supabase Storage)
