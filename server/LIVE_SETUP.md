# Live Setup Guide - The Century

Complete setup guide om live te gaan met echte accounts en services (geen local storage).

## 📋 Accounts die je nodig hebt

### 1. **Supabase** (Database + Storage voor Phase 2)
- **Account**: https://supabase.com
- **Wat je nodig hebt**:
  - Project aanmaken
  - Database connection string
  - API keys (voor Phase 2: Storage)
- **Kosten**: Free tier is voldoende voor start

### 2. **Stripe** (Payments)
- **Account**: https://stripe.com
- **Wat je nodig hebt**:
  - Live API keys (niet test keys!)
  - Webhook endpoint configureren
  - Webhook signing secret
- **Kosten**: 1.4% + €0.25 per transactie (EU)

### 3. **Hosting** (Server deployment)
Kies één van:
- **Vercel** (aanbevolen voor Node.js): https://vercel.com
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform

### 4. **Frontend Hosting**
- **Vercel** (aanbevolen): https://vercel.com
- **Netlify**: https://netlify.com
- **Cloudflare Pages**: https://pages.cloudflare.com

---

## 🔧 Stap 1: Supabase Setup

### 1.1 Project aanmaken
1. Ga naar https://supabase.com
2. Klik "New Project"
3. Kies:
   - **Name**: `the-century` (of jouw naam)
   - **Database Password**: Genereer sterk wachtwoord (bewaar dit!)
   - **Region**: Kies dichtstbijzijnde (bijv. `West EU` voor Nederland)
   - **Pricing Plan**: Free tier is voldoende

### 1.2 Database migratie uitvoeren
1. Ga naar **SQL Editor** in Supabase dashboard
2. Open `server/src/db/migration_001_phase1.sql`
3. Kopieer hele bestand
4. Plak in SQL Editor
5. Klik "Run"

### 1.3 Connection string ophalen
1. Ga naar **Settings** → **Database**
2. Scroll naar **Connection string**
3. Kies **URI** tab
4. Kopieer connection string (ziet eruit als: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`)
5. **BELANGRIJK**: Vervang `[PASSWORD]` met je database password

### 1.4 (Phase 2) Storage bucket aanmaken
Voor nu niet nodig, maar voor later:
1. Ga naar **Storage** in dashboard
2. Klik "New bucket"
3. Naam: `capsule-media`
4. Public: **OFF** (private)
5. File size limit: 100MB (of hoger voor video)

---

## 💳 Stap 2: Stripe Setup (LIVE)

### 2.1 Account activeren
1. Ga naar https://dashboard.stripe.com
2. Zorg dat account **live** is (niet test mode!)
3. Vul business details in (verplicht voor live)

### 2.2 Live API keys ophalen
1. Ga naar **Developers** → **API keys**
2. Zorg dat je in **Live mode** bent (toggle rechtsboven)
3. Kopieer **Secret key** (begint met `sk_live_...`)
4. **BELANGRIJK**: Dit is je `STRIPE_SECRET_KEY`

### 2.3 Webhook endpoint configureren
1. Ga naar **Developers** → **Webhooks**
2. Klik "Add endpoint"
3. **Endpoint URL**: `https://jouw-server-url.com/api/payments/webhook`
   - Voor Vercel: `https://jouw-project.vercel.app/api/payments/webhook`
   - Voor Railway: `https://jouw-app.railway.app/api/payments/webhook`
4. **Events to send**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Klik "Add endpoint"
6. Kopieer **Signing secret** (begint met `whsec_...`)
7. **BELANGRIJK**: Dit is je `STRIPE_WEBHOOK_SECRET`

### 2.4 Test met Stripe CLI (optioneel voor development)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# Of: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks naar local server (development only)
stripe listen --forward-to localhost:5000/api/payments/webhook
```

---

## 🌐 Stap 3: Server Deployment

### 3.1 Environment Variables voor Production

Maak `.env.production` aan (of gebruik hosting dashboard):

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Stripe (LIVE keys!)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (waar je frontend gehost wordt)
FRONTEND_URL=https://jouw-frontend.vercel.app,https://www.jouwdomein.com

# (Phase 2) Supabase Storage
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...  # Van Supabase Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Voor server-side operations
```

### 3.2 Deploy naar Vercel (aanbevolen)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd server
   vercel
   ```

4. **Configure environment variables**:
   - Ga naar Vercel dashboard → Project → Settings → Environment Variables
   - Voeg alle variabelen uit `.env.production` toe

5. **Update Stripe webhook URL**:
   - Ga naar Stripe dashboard → Webhooks
   - Update endpoint URL naar: `https://jouw-project.vercel.app/api/payments/webhook`

### 3.3 Alternatief: Railway

1. Ga naar https://railway.app
2. Klik "New Project" → "Deploy from GitHub repo"
3. Selecteer je repository
4. Railway detecteert automatisch Node.js
5. Voeg environment variables toe in Railway dashboard
6. Railway geeft je automatisch een URL

---

## 🎨 Stap 4: Frontend Deployment

### 4.1 Environment Variables voor Frontend

Maak `.env.production` aan in root:

```env
VITE_API_URL=https://jouw-server.vercel.app
# Of andere hosting URL
```

### 4.2 Deploy naar Vercel

1. **In root directory**:
   ```bash
   vercel
   ```

2. **Configure environment variables**:
   - `VITE_API_URL`: Je server URL

3. **Update CORS in server**:
   - Zorg dat `FRONTEND_URL` in server `.env` je frontend URL bevat

---

## ✅ Stap 5: Pre-Launch Tests

Voer **ALLE** tests uit voordat je live gaat. Zie `SMOKE_TESTS.md` voor complete test suite.

### Quick checklist:
- [ ] Database migratie succesvol
- [ ] Capsule creation werkt (krijgt `public_id`)
- [ ] State machine blokkeert illegale transitions
- [ ] Payment intent creation werkt
- [ ] Webhook verification werkt (met echte Stripe webhook)
- [ ] Idempotency werkt (duplicate webhook = no-op)
- [ ] Rate limiting werkt (11 requests = geblokkeerd)
- [ ] Geen internal IDs in API responses

---

## 🔒 Security Checklist

- [ ] **Geen secrets in code**: Alle keys in environment variables
- [ ] **HTTPS only**: Zorg dat alle URLs HTTPS zijn
- [ ] **CORS configured**: Alleen jouw frontend domains
- [ ] **Rate limiting**: Actief op alle endpoints
- [ ] **Webhook verification**: Stripe signature wordt gecheckt
- [ ] **Database SSL**: `ssl: { rejectUnauthorized: false }` in production
- [ ] **No internal IDs**: Alleen `public_id` in API responses

---

## 📊 Monitoring Setup (aanbevolen)

### Stripe Dashboard
- Monitor payments in real-time
- Set up email alerts voor failed payments

### Supabase Dashboard
- Monitor database performance
- Check connection pool usage

### Vercel Analytics (optioneel)
- Monitor API response times
- Check error rates

---

## 🚀 Launch Day Checklist

1. [ ] Alle environment variables geconfigureerd
2. [ ] Database migratie uitgevoerd
3. [ ] Stripe webhook endpoint geconfigureerd en getest
4. [ ] Frontend en backend deployed
5. [ ] CORS correct geconfigureerd
6. [ ] Test payment gedaan met Stripe test card
7. [ ] Webhook ontvangen en verwerkt
8. [ ] Rate limiting getest
9. [ ] Error handling werkt
10. [ ] Monitoring ingesteld

---

## 🆘 Troubleshooting

### Webhook niet ontvangen
- Check of webhook URL correct is in Stripe dashboard
- Check server logs voor errors
- Test met Stripe CLI eerst: `stripe listen --forward-to ...`

### Database connection failed
- Check of `DATABASE_URL` correct is (met password!)
- Check of Supabase firewall je IP toestaat
- Check SSL configuratie

### CORS errors
- Check of `FRONTEND_URL` correct is in server `.env`
- Check of frontend URL exact matcht (inclusief https://)

### Payment intent fails
- Check of Stripe keys LIVE zijn (niet test!)
- Check of capsule state `pending_payment` is
- Check Stripe dashboard voor error details

---

## 📝 Next Steps na Launch

1. **Phase 2**: Supabase Storage integratie (verwijder base64)
2. **Phase 3**: Frontend integratie met echte API
3. **Email service**: Certificate emails (Resend/SendGrid)
4. **Analytics**: User tracking (optioneel)
5. **Backup strategy**: Database backups instellen

---

## 💰 Kosten Overzicht

- **Supabase**: Free tier (tot 500MB database, 1GB storage)
- **Stripe**: 1.4% + €0.25 per transactie
- **Vercel**: Free tier (100GB bandwidth)
- **Totaal**: ~€0 per maand (tot je groeit)

---

**Je bent nu klaar om live te gaan! 🎉**
