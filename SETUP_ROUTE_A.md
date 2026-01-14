# Route A Setup + Verification Guide

Complete setup checklist voor Route A: Client-side Supabase SDK Upload.

## 📋 Stap 1: Storage Policies Toepassen (VERPLICHT)

### Actie
1. Ga naar **Supabase Dashboard** → **SQL Editor**
2. Open `server/src/db/storage_policies_route_a.sql`
3. Kopieer hele bestand
4. Plak in SQL Editor
5. Klik **Run**

### Verificatie
Check direct daarna in Supabase UI:
- **Storage** → Bucket `capsules` bestaat
- **Storage** → **Policies** → Policies staan op `storage.objects` en zijn **enabled**

⚠️ **Belangrijk**: Als policies niet aan staan, krijg je bij upload óf alles toegestaan óf alles 403 (afhankelijk van defaults).

---

## 🔧 Stap 2: Environment Variables Instellen (VERPLICHT)

### Backend (Server)
In `.env` (project root):
```env
# Supabase Storage (Backend - service role)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Van Supabase Settings → API → service_role key
SUPABASE_BUCKET=capsules  # Optional, default is "capsules"
```

### Frontend (Vite)
In `.env` (project root):
```env
# Supabase Storage (Frontend - anon key)
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Van Supabase Settings → API → anon/public key
VITE_SUPABASE_BUCKET=capsules  # Optional, default is "capsules"
```

### Smoke Test (Node.js)
In `.env` (project root):
```env
# Supabase Storage (Smoke test - anon key)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJ...  # Zelfde als VITE_SUPABASE_ANON_KEY
SUPABASE_BUCKET=capsules  # Optional, default is "capsules"
```

**Notities**:
- Frontend gebruikt `VITE_` prefix (Vite vereist dit)
- Smoke test gebruikt `SUPABASE_` prefix (Node.js script, geen Vite)
- `SUPABASE_ANON_KEY` = `VITE_SUPABASE_ANON_KEY` (zelfde waarde)

---

## 🧪 Stap 3: Smoke Test Runnen

Als policies + env vars kloppen:

```bash
npm run test:phase3b
```

### Wat je verwacht

✅ **1. Create capsule** - Succes  
✅ **2a. Create photo upload** - Path terug  
✅ **2b. Create video upload** - Path terug  
✅ **3a. Supabase photo upload** - Upload slaagt  
✅ **3b. Supabase video upload** - Upload slaagt  
✅ **4a. Finalize photo upload** - Finalize slaagt  
✅ **4b. Finalize video upload** - Finalize slaagt  
✅ **5. Verify capsule paths** - GET ziet paths  
✅ **6. Test policy: fake capsuleId upload should fail (403)** - 403 (of "not allowed")

---

## 🐛 Stap 4: Diagnostisch Schema (als het faalt)

### Fail bij Supabase Upload (meestal 403)

**Mogelijke oorzaken**:
1. ❌ Policies niet toegepast → Run `storage_policies_route_a.sql` opnieuw
2. ❌ Bucket mismatch → Check `SUPABASE_BUCKET` env var (moet `capsules` zijn)
3. ❌ Path pattern klopt niet → Check of path `{public_id}/photos/...` of `{public_id}/video/...` is
4. ❌ State check faalt → Capsule moet `draft` of `pending_payment` state hebben
5. ❌ Capsule exists check faalt → Check of `public_id` bestaat in `capsules` tabel

**Check**:
```bash
# Check env vars
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
echo $SUPABASE_BUCKET

# Check policies in Supabase UI
# Storage → Policies → storage.objects → Should see "Allow uploads to capsules bucket (anon)"
```

### Fail bij Fake CapsuleId Test (niet 403 maar "ok")

**Mogelijke oorzaken**:
1. ❌ Policy check is te permissief → Check SQL policy (moet `capsule exists` check hebben)
2. ❌ Capsule exists check werkt niet → Check `split_part(name, '/', 1)` in policy SQL

**Check**:
```sql
-- In Supabase SQL Editor, check policies:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Fail bij Finalize

**Mogelijke oorzaken**:
1. ❌ Backend verwacht andere payload → Check `finalize-upload` endpoint
2. ❌ Path mismatch → Path die je uploadde != path die finalize doorgeeft
3. ❌ Backend state machine blokkeert → Check capsule state (moet `draft` of `pending_payment` zijn)

**Check**:
```bash
# Check backend logs
# Look for errors in finalize-upload endpoint
```

---

## ✅ Stap 5: Deployment-Ready Checklist

- [x] ✅ Policies zijn uitgevoerd en enabled
- [x] ✅ Env vars zijn correct (VITE_ voor frontend, SUPABASE_ voor smoke test)
- [x] ✅ Smoke test groen is (alle stappen ✅)
- [x] ✅ `upsert: false` in upload (zodat niemand kan overschrijven)
- [x] ✅ Geen DELETE policy voor anon (alleen via backend/service role)
- [x] ✅ Upload alleen toegestaan voor `draft` + `pending_payment` states

---

## 🚀 Volgende Stappen

Als alles groen is:
1. ✅ Policies zijn uitgevoerd
2. ✅ Env vars zijn correct
3. ✅ Smoke test is groen

Dan is Route A **klaar voor deployment**! 🎉
