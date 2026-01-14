# Policy Script Zonder ALTER TABLE

## 🔍 Probleem

Permission error: "must be owner of relation storage.objects"

**Oorzaak**: `storage.objects` is een managed tabel in Supabase, en je database rol heeft geen privileges voor ALTER TABLE.

## ✅ Oplossing

Gebruik versie **ZONDER** ALTER TABLE: `storage_policies_route_a_no_alter.sql`

**Wat deze versie doet**:
- ✅ DROP POLICY (als bestaand)
- ✅ CREATE POLICY (nieuwe policy)
- ❌ ALTER TABLE (verwijderd - niet nodig, RLS is meestal al enabled)

## 📋 Stappen

### 1. Run Script (Zonder ALTER TABLE)

**In Supabase SQL Editor:**
1. Open `server/src/db/storage_policies_route_a_no_alter.sql`
2. Kopieer hele bestand (16 regels)
3. Plak in SQL Editor
4. Klik **Run**

**Verwacht**: "Success. No rows returned" (of vergelijkbaar)

### 2. Verifieer Policy Bestaat

```sql
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

**Verwacht**: Je ziet policy "Allow uploads to capsules bucket (anon)"

### 3. Als CREATE POLICY ook faalt met permission error

Dan moet je via **Storage Policies UI** (Supabase Dashboard → Storage → Policies).

### 4. Run Smoke Test

```bash
npm run test:phase3b
```

---

## 🔄 Alternatief: Storage Policies UI (als SQL faalt)

1. Ga naar **Supabase Dashboard** → **Storage** → **Policies**
2. Klik **New policy** op `storage.objects`
3. Configureer:
   - **Policy name**: "Allow uploads to capsules bucket (anon)"
   - **Allowed operation**: INSERT
   - **Target roles**: anon
   - **Policy definition**: (zie SQL hieronder)

**Policy SQL (voor UI)**:
```sql
bucket_id = 'capsules'
AND (
  EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part(name, '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  )
)
```
