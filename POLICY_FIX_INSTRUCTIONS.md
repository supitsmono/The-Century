# Policy Fix Instructions - 403 Error Resolution

## Probleem
De smoke test faalt met: `Supabase upload failed: new row violates row-level security policy (status: 403)`

Dit betekent dat de RLS policy de upload blokkeert, ook al is de policy toegepast.

## Oplossing

### Stap 1: Run de nieuwe policy script

1. Open Supabase Dashboard → **SQL Editor**
2. Open het bestand: `server/src/db/storage_policies_route_a_working.sql`
3. Kopieer **alleen de SQL** (zonder comments als je wilt, maar comments zijn oké)
4. Plak in SQL Editor
5. Klik **Run**

### Stap 2: Verifieer de policy

Run deze query in SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';
```

Je moet zien:
- `policyname`: "Allow uploads to capsules bucket (anon)"
- `cmd`: "INSERT"
- `with_check`: bevat `bucket_id = 'capsules'` en de EXISTS check

### Stap 3: Test de policy logica handmatig

Run deze query (vervang `YOUR_CAPSULE_ID` met een echte public_id uit je capsules tabel):

```sql
-- Check of een test path zou moeten werken
SELECT 
  'YOUR_CAPSULE_ID/photos/test.jpg' as test_path,
  (string_to_array('YOUR_CAPSULE_ID/photos/test.jpg', '/'))[1] as extracted_id,
  EXISTS (
    SELECT 1
    FROM public.capsules cap
    WHERE cap.public_id::text = (string_to_array('YOUR_CAPSULE_ID/photos/test.jpg', '/'))[1]
      AND cap.state IN ('draft', 'pending_payment')
  ) as should_allow;
```

Als `should_allow` = `true`, dan zou de policy moeten werken.

### Stap 4: Check capsule state

Run deze query om te zien welke capsules in draft/pending_payment zijn:

```sql
SELECT 
  public_id,
  state,
  created_at
FROM public.capsules
WHERE state IN ('draft', 'pending_payment')
ORDER BY created_at DESC
LIMIT 5;
```

**Belangrijk**: De capsule die je gebruikt in de smoke test moet `state = 'draft'` of `'pending_payment'` hebben!

### Stap 5: Run smoke test opnieuw

```bash
npm run test:phase3b
```

## Als het nog steeds faalt

1. **Check bucket name**: Zorg dat `SUPABASE_BUCKET=capsules` in `.env` staat
2. **Check capsule state**: De capsule moet `draft` of `pending_payment` zijn
3. **Check path format**: Het pad moet zijn `{public_id}/photos/...` of `{public_id}/video/...` (zonder `capsules/` prefix)
4. **Check anon key**: Zorg dat `SUPABASE_ANON_KEY` en `VITE_SUPABASE_ANON_KEY` in `.env` staan

## Debug query (als laatste redmiddel)

Run dit om te zien wat er precies mis gaat:

```sql
-- Vervang met je echte capsule public_id en test path
WITH test_data AS (
  SELECT 
    'YOUR_CAPSULE_ID'::text as capsule_id,
    'YOUR_CAPSULE_ID/photos/test.jpg'::text as test_path
)
SELECT 
  td.capsule_id,
  td.test_path,
  (string_to_array(td.test_path, '/'))[1] as extracted_id,
  (SELECT state FROM public.capsules WHERE public_id::text = td.capsule_id) as capsule_state,
  EXISTS (
    SELECT 1
    FROM public.capsules cap
    WHERE cap.public_id::text = (string_to_array(td.test_path, '/'))[1]
      AND cap.state IN ('draft', 'pending_payment')
  ) as policy_check_result;
```
