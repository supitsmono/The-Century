# Policies Setup Checklist

Snelle checklist voor het toepassen van Storage policies in Supabase.

## ✅ Stap 1: Policies Toepassen (Supabase SQL Editor)

### Actie
1. Ga naar **Supabase Dashboard** → **SQL Editor**
2. Open `server/src/db/storage_policies_route_a.sql`
3. Kopieer **hele bestand**
4. Plak in SQL Editor
5. Klik **Run**

### Verificatie (direct na Run)
Check in Supabase UI:

1. **Storage** → **Buckets** → **capsules**
   - ✅ Bucket bestaat
   - ✅ Bucket is **private** (niet public)

2. **Storage** → **Policies**
   - ✅ Policy zichtbaar: `"Allow uploads to capsules bucket (anon)"`
   - ✅ Policy is **enabled**
   - ✅ Policy staat op `storage.objects`
   - ✅ Policy type: **INSERT** (voor anon users)

### SQL Query om te Verifiëren (Optioneel)
Als je wilt checken of de policy correct is aangemaakt:

```sql
-- Check policies op storage.objects
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';
```

**Verwacht**: 1 row met policy details.

---

## ⚠️ Belangrijk

**Zonder policies**:
- ❌ Uploads krijgen **403 Forbidden** (als RLS strict is)
- ❌ Of (erger) **alles wordt toegestaan** (als RLS niet enabled is)
- ❌ Smoke test zegt niets over "deployment-ready"

**Met policies**:
- ✅ Uploads alleen voor geldige capsules in `draft`/`pending_payment` state
- ✅ Fake capsuleId uploads worden geblokkeerd (403)
- ✅ Smoke test is betekenisvol

---

## 🔧 Stap 2: Environment Variables (na Policies)

Na policies setup, zet env vars:

### Root `.env` (voor smoke test)
```env
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...  # Van Supabase Settings → API → anon/public key
```

### Frontend env (voor Vite - zelfde bestand)
```env
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Zelfde als SUPABASE_ANON_KEY
```

**Notitie**: `SUPABASE_ANON_KEY` en `VITE_SUPABASE_ANON_KEY` hebben dezelfde waarde (anon/public key van Supabase).

---

## 🧪 Stap 3: Smoke Test (pas na Policies + Env Vars)

```bash
npm run test:phase3b
```

**Pas runnen** nadat:
- ✅ Policies zijn toegepast en enabled
- ✅ Env vars zijn gezet
- ✅ Backend server draait (optioneel, maar aanbevolen voor volledige test)

---

## ✅ Ready Checklist

- [ ] Policies SQL script is uitgevoerd in Supabase SQL Editor
- [ ] Policy is zichtbaar en enabled in Storage → Policies
- [ ] Bucket `capsules` bestaat en is private
- [ ] `SUPABASE_ANON_KEY` staat in `.env`
- [ ] `VITE_SUPABASE_ANON_KEY` staat in `.env`
- [ ] Klaar voor smoke test!
