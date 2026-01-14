# Environment Variables Setup (Route A)

Na policies setup, nu env vars instellen.

## ✅ Stap 1: Policies zijn toegepast

Check in Supabase UI:
- Storage → Policies → Policy "Allow uploads to capsules bucket (anon)" is zichtbaar en enabled ✅

## 🔧 Stap 2: Environment Variables Toevoegen

Voeg toe aan `.env` (project root):

```env
# Supabase Storage (Backend - service role)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Al gezet? (voor backend)

# Supabase Storage (Frontend + Smoke Test - anon key)
SUPABASE_ANON_KEY=eyJ...  # Van Supabase Settings → API → anon/public key
VITE_SUPABASE_URL=https://[PROJECT].supabase.co  # Zelfde als SUPABASE_URL
VITE_SUPABASE_ANON_KEY=eyJ...  # Zelfde als SUPABASE_ANON_KEY
```

**Waar vind je de anon key?**
1. Ga naar Supabase Dashboard → **Settings** → **API**
2. Scroll naar **Project API keys**
3. Kopieer **anon/public** key (begint meestal met `eyJ...`)
4. Dit is je `SUPABASE_ANON_KEY` (en `VITE_SUPABASE_ANON_KEY`)

**Notitie**:
- `SUPABASE_ANON_KEY` = voor smoke test (Node.js script)
- `VITE_SUPABASE_ANON_KEY` = voor frontend (Vite vereist `VITE_` prefix)
- Beide hebben dezelfde waarde (anon/public key)

---

## 🧪 Stap 3: Smoke Test (na env vars)

```bash
npm run test:phase3b
```

**Verwacht**: Alle tests ✅ (inclusief fake capsuleId test die 403 geeft)
