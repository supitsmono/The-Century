# Quick Start - Live Gaan 🚀

Snelle checklist om live te gaan met The Century.

## ⚡ 5-Minuten Setup

### 1. Accounts aanmaken (15 min)

- [ ] **Supabase**: https://supabase.com → New Project
- [ ] **Stripe**: https://stripe.com → Account activeren (live mode)
- [ ] **Vercel**: https://vercel.com → Account aanmaken (voor hosting)

### 2. Database Setup (5 min)

1. Supabase dashboard → **SQL Editor**
2. Open `server/src/db/migration_001_phase1.sql`
3. Kopieer en plak → **Run**
4. **Settings** → **Database** → Kopieer connection string
5. Vervang `[PASSWORD]` met je database password

### 3. Stripe Setup (10 min)

1. Stripe dashboard → **Developers** → **API keys** (LIVE mode!)
2. Kopieer **Secret key** → `STRIPE_SECRET_KEY`
3. **Developers** → **Webhooks** → **Add endpoint**
   - URL: `https://jouw-server.vercel.app/api/payments/webhook` (update later)
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Kopieer **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables

Maak `.env` aan in `server/` directory:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://jouw-frontend.vercel.app
```

### 5. Deploy Server (5 min)

```bash
cd server
vercel login
vercel
```

In Vercel dashboard:
- **Settings** → **Environment Variables**
- Voeg alle variabelen uit `.env` toe
- Update Stripe webhook URL naar Vercel URL

### 6. Deploy Frontend (5 min)

```bash
# In root directory
vercel
```

In Vercel dashboard:
- **Settings** → **Environment Variables**
- `VITE_API_URL`: Je server URL (van stap 5)

### 7. Run Smoke Tests (30 min)

```bash
cd server
export SERVER_URL=https://jouw-server.vercel.app
./test-scripts.sh all
```

Of volg `SMOKE_TESTS.md` voor handmatige tests.

---

## ✅ Pre-Launch Checklist

- [ ] Database migratie uitgevoerd
- [ ] Stripe webhook geconfigureerd en getest
- [ ] Server deployed en online
- [ ] Frontend deployed en online
- [ ] CORS correct geconfigureerd
- [ ] Alle smoke tests groen
- [ ] Test payment gedaan (met Stripe test card)
- [ ] Webhook ontvangen en verwerkt

---

## 📚 Volledige Documentatie

- **LIVE_SETUP.md**: Complete setup guide met alle details
- **SMOKE_TESTS.md**: Uitgebreide test checklist
- **test-scripts.sh**: Geautomatiseerde test scripts

---

## 🆘 Problemen?

- **Webhook niet ontvangen**: Check Stripe dashboard → Webhooks → Recent events
- **Database connection failed**: Check `DATABASE_URL` (met password!)
- **CORS errors**: Check `FRONTEND_URL` in server `.env`

---

**Klaar? Start met `LIVE_SETUP.md` voor complete instructies! 🎉**
