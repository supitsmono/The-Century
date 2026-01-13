# Hoe test ik Phase 1?

## Stap 0: Voorbereiding (5 min)

### 1. Check of je .env file bestaat
```bash
ls -la .env
```

Als die niet bestaat, maak hem aan:
```bash
cp .env.example .env  # Als die bestaat
# Of maak handmatig .env aan
```

### 2. Vul .env in met minimaal:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/the_century
STRIPE_SECRET_KEY=sk_test_...  # Van Stripe dashboard
STRIPE_WEBHOOK_SECRET=whsec_...  # Voor nu: gebruik "test" (wordt later Stripe CLI secret)
```

**Voor Stripe keys:**
- Ga naar https://dashboard.stripe.com/test/apikeys
- Kopieer "Secret key" → `STRIPE_SECRET_KEY`
- Voor webhook secret: gebruik eerst "test" (echte webhook test komt later)

### 3. Start de server
```bash
npm run server
```

Je zou moeten zien: `Server running on port 5000`

### 4. Test health endpoint
Open in browser: http://localhost:5000/health

Of met curl:
```bash
curl http://localhost:5000/health
```

Verwacht: `{"status":"ok","timestamp":"..."}`

---

## Stap 1: Database Migratie (5-10 min)

### Run de migration:
```bash
psql $DATABASE_URL -f server/src/db/migration_001_phase1.sql
```

**Of als DATABASE_URL niet werkt:**
```bash
psql -U je_username -d the_century -f server/src/db/migration_001_phase1.sql
```

### Check of het werkt:
```sql
-- Connect to database
psql $DATABASE_URL

-- Check columns
\d capsules

-- Of met SQL:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'capsules' 
AND column_name IN ('public_id', 'state', 'open_at');
```

Je zou moeten zien:
- ✅ `public_id` (uuid)
- ✅ `state` (character varying)
- ✅ `open_at` (timestamp with time zone)

---

## Stap 2: Test Capsule Creation (5 min)

Open een nieuwe terminal (server moet blijven draaien).

### Maak een capsule:
```bash
curl -X POST http://localhost:5000/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "capsule": {
      "country": "Netherlands",
      "town": "Amsterdam",
      "dob": "1990-01-15",
      "message": "Dit is een test capsule",
      "photos": [],
      "ageAtCreation": 34,
      "openAt": "2125-01-01T00:00:00Z"
    },
    "email": "test@example.com"
  }'
```

### Verwacht response:
```json
{
  "public_id": "een-uuid-hier",
  "message": "Capsule created successfully",
  "email": "test@example.com"
}
```

**Kopieer de `public_id` - die heb je nodig voor andere tests!**

### Check in database:
```sql
SELECT public_id, state, country, town FROM capsules WHERE public_id = 'jouw-public-id';
```

Verwacht:
- ✅ `state` = `'draft'`
- ✅ `public_id` is een UUID
- ✅ Geen internal `id` in de response (alleen `public_id`)

---

## Stap 3: Test State Machine (5 min)

### Test 3a: Probeer te "cheaten" - seal een draft capsule (zou moeten falen)

Vervang `{public_id}` met je echte public_id:

```bash
curl -X POST http://localhost:5000/api/capsules/{public_id}/seal \
  -H "Content-Type: application/json"
```

**Verwacht:** 400 error met message zoals:
```
"Invalid state transition: draft → sealed. Allowed transitions from draft: pending_payment"
```

✅ Als dit faalt = state machine werkt!

### Test 3b: Check state in database
```sql
SELECT public_id, state FROM capsules WHERE public_id = 'jouw-public-id';
```

State moet nog steeds `'draft'` zijn (niet veranderd naar `sealed`).

---

## Stap 4: Test Payment Flow (10 min)

### Stap 4a: Initiate Payment
Dit zet de capsule state naar `pending_payment`:

```bash
curl -X POST http://localhost:5000/api/capsules/{public_id}/initiate-payment \
  -H "Content-Type: application/json"
```

**Verwacht:**
```json
{
  "message": "Payment initiated",
  "public_id": "jouw-public-id",
  "state": "pending_payment"
}
```

### Stap 4b: Create Payment Intent

```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "public_id": "jouw-public-id",
    "amount": 2999,
    "currency": "eur"
  }'
```

**Verwacht:**
```json
{
  "client_secret": "pi_..._secret_...",
  "payment_intent_id": "pi_...",
  "amount": 2999,
  "currency": "eur"
}
```

✅ Als je `client_secret` krijgt = Stripe werkt!

### Check in database:
```sql
SELECT public_id, state, payment_id FROM capsules WHERE public_id = 'jouw-public-id';
```

State moet `'pending_payment'` zijn.

---

## Stap 5: Webhook Test (OPTIONEEL - vereist Stripe CLI)

Dit is het lastigste deel. Skip dit als je Stripe CLI niet hebt geïnstalleerd.

### Install Stripe CLI (als je dat nog niet hebt):
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Of download van: https://stripe.com/docs/stripe-cli
```

### Stripe CLI setup:
```bash
# Login
stripe login

# Start webhook listener (in nieuwe terminal)
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Je krijgt dan output zoals:
```
> Ready! Your webhook signing secret is whsec_... (^C to quit)
```

**Kopieer die `whsec_...` en zet in .env:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Herstart je server** (om nieuwe env var te laden)

### Trigger test event:
```bash
# In nieuwe terminal
stripe trigger payment_intent.succeeded
```

### Check database:
```sql
SELECT public_id, state, payment_id FROM capsules WHERE public_id = 'jouw-public-id';
SELECT * FROM webhook_events;
```

Verwacht:
- ✅ Capsule `state` = `'paid'`
- ✅ `webhook_events` table heeft een entry

---

## Stap 6: Rate Limiting Test (2 min)

### Spam 11 requests:
```bash
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

**Verwacht:**
- ✅ Requests 1-10: Success (200/201)
- ✅ Request 11: 429 Too Many Requests

---

## Troubleshooting

### "Database connection error"
- Check of PostgreSQL draait
- Check DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
- Test connectie: `psql $DATABASE_URL -c "SELECT 1"`

### "Stripe secret key invalid"
- Check of `STRIPE_SECRET_KEY` begint met `sk_test_`
- Test in Stripe dashboard of de key actief is

### "Invalid state transition" errors
- ✅ Dit is GOED! De state machine werkt
- Check welke state je capsule heeft: `SELECT state FROM capsules WHERE public_id = '...'`

### "Capsule not found"
- Check of je de juiste `public_id` gebruikt
- Check database: `SELECT public_id FROM capsules;`

### Server start niet
- Check of poort 5000 vrij is: `lsof -i :5000`
- Check TypeScript errors: `cd server && npx tsc --noEmit`

---

## Quick Test Summary

Minimale tests om te checken of alles werkt:

1. ✅ Health check: `curl http://localhost:5000/health`
2. ✅ Create capsule: POST /api/capsules
3. ✅ State machine: Try to seal draft capsule → should fail
4. ✅ Payment intent: POST /api/capsules/{id}/initiate-payment → POST /api/payments/create-intent
5. ✅ Rate limiting: Spam 11 requests → 11th should fail

Als deze 5 werken = Phase 1 is goed! 🎉

