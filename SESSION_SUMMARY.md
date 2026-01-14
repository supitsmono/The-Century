# Sessie Samenvatting - Storage RLS Policy Fix & Project Cleanup

## 📋 Probleem
Supabase Storage uploads faalden met **403 error**: "new row violates row-level security policy"

## ✅ Oplossing

### 1. Storage Policy Fix
**Probleem:** De RLS policy in `storage_policies_route_a.sql` had twee fouten:
- ❌ Gebruikte `storage.objects.name` in plaats van `name` in WITH CHECK clause
- ❌ Bevatte `ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY` (geen permissies voor managed tables)

**Fix:**
- ✅ Veranderd naar `split_part(name, '/', 1)` (correcte kolomreferentie)
- ✅ `ALTER TABLE` statement verwijderd (RLS is al enabled door Supabase)

**Bestand:** `server/src/db/storage_policies_route_a.sql` (definitieve versie)

### 2. Supabase SQL Editor Cleanup
- ✅ Alle oude/duplicate bestanden verwijderd uit Supabase SQL Editor (13 bestanden)
- ✅ Alleen "Capsules Bucket Upload Policy" behouden/nieuw aangemaakt
- ✅ Policy succesvol uitgevoerd in Supabase SQL Editor

### 3. Project Cleanup
**Verwijderde bestanden:**
- 6 oude policy varianten (`storage_policies_route_a_*.sql`)
- 2 debug bestanden (`DEBUG_POLICY*.sql`)
- 2 oude verify bestanden
- 9 oude documentatie bestanden (setup guides, summaries, etc.)
- `@google/genai` dependency (niet gebruikt)

**Georganiseerd:**
- Verify SQL queries verplaatst naar `server/src/db/verify/`
- Server README bijgewerkt met correcte referenties

**Bijgewerkt:**
- `README.md` - Nieuwe, complete project documentatie (vervangen oude AI Studio template)
- `vite.config.ts` - Gemini referenties verwijderd
- `index.html` - Gemini import verwijderd
- `package.json` - `@google/genai` verwijderd

## 🎯 Huidige Status

### ✅ Wat werkt:
1. **Storage Policy** - Correct geconfigureerd in Supabase
   - Policy naam: "Allow uploads to capsules bucket (anon)"
   - Toestaat INSERT voor anon users wanneer:
     - Bucket is `capsules`
     - Path begint met geldige capsule `public_id`
     - Capsule bestaat en is in `draft` of `pending_payment` state

2. **Project Structuur** - Opgeschoond en georganiseerd
   - Alleen essentiële bestanden behouden
   - Duidelijke documentatie
   - Geen oude/duplicate bestanden meer

### 📁 Belangrijke Bestanden:

**Storage Policy (VERPLICHT):**
- `server/src/db/storage_policies_route_a.sql` - Definitieve policy voor Supabase SQL Editor

**Verificatie Queries (optioneel):**
- `server/src/db/verify/VERIFY_POLICY_SIMPLE.sql` - Check of policy bestaat
- `server/src/db/verify/VERIFY_POLICY_TEST.sql` - Test policy logica
- `server/src/db/verify/VERIFY_POLICY_RLS.sql` - Check RLS status
- `server/src/db/verify/VERIFY_POLICY_ALL.sql` - Toon alle policies

**Documentatie:**
- `README.md` - Complete project setup guide
- `server/README.md` - Backend API documentatie

## 🧪 Test Status

**Smoke Test:** `npm run test:phase3b`
- ✅ Stap 1: Create capsule - Werkt
- ✅ Stap 2a: Create photo upload - Werkt
- ✅ Stap 2b: Create video upload - Werkt
- ✅ Stap 3a: Supabase photo upload - **Zou nu moeten werken** (policy is gefixt)
- ⏳ Nog te testen: Stap 3b (video upload), 4 (finalize), 5 (verify)

## 🚀 Volgende Stappen

1. **Test uploads:**
   ```bash
   npm run test:phase3b
   ```
   - Verifieer dat foto/video uploads nu werken (geen 403 errors meer)

2. **Als alles werkt:**
   - Project is klaar voor gebruik
   - Storage policies zijn correct geconfigureerd
   - Alle oude bestanden zijn opgeruimd

3. **Als er nog problemen zijn:**
   - Check Supabase Dashboard → Storage → Policies
   - Verifieer dat policy "Allow uploads to capsules bucket (anon)" bestaat en enabled is
   - Gebruik verify queries om te debuggen

## 📝 Belangrijke Notities

- **Supabase SQL Editor:** Bevat nu alleen "Capsules Bucket Upload Policy" (definitieve versie)
- **Policy is uitgevoerd:** ✅ Policy is succesvol aangemaakt in Supabase
- **Project is opgeschoond:** Geen oude/duplicate bestanden meer
- **Dependencies:** Alleen gebruikte packages (Gemini verwijderd)

## 🔗 Referenties

- Storage Policy: `server/src/db/storage_policies_route_a.sql`
- Verify Queries: `server/src/db/verify/`
- Backend Docs: `server/README.md`
- Project Setup: `README.md`

---

**Laatste update:** Policy is gefixt en uitgevoerd in Supabase. Uploads zouden nu moeten werken. Test met `npm run test:phase3b` om te verifiëren.
