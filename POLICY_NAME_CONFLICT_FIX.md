# Policy Name Conflict Fix

## 🔍 Probleem

De policy definitie gebruikt `c.name` (capsule name) in plaats van `name` (storage.objects.name / object path).

**Policy definitie (FOUT)**:
```sql
split_part((c.name)::text, '/'::text, 1)
```

Dit betekent dat Supabase `name` interpreteert als `c.name` (capsule name) in plaats van `storage.objects.name` (object path).

## ✅ Oplossing

Gebruik een andere benadering om naamconflict te voorkomen:

### Optie 1: Table Alias (Aanbevolen)

Gebruik een andere alias voor capsules (`cap` i.p.v. `c`) en gebruik `name` direct (zonder prefix):

```sql
CREATE POLICY "Allow uploads to capsules bucket (anon)"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'capsules'
  AND (
    EXISTS (
      SELECT 1
      FROM public.capsules cap
      WHERE cap.public_id::text = (string_to_array(name, '/'))[1]
        AND cap.state IN ('draft', 'pending_payment')
    )
  )
);
```

**Verschil**: 
- `cap` i.p.v. `c` (voorkomt conflict met `name`)
- `string_to_array(name, '/')[1]` i.p.v. `split_part(name, '/', 1)` (alternatieve manier)

### Optie 2: Via Storage Policies UI (Als SQL blijft falen)

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
    FROM public.capsules cap
    WHERE cap.public_id::text = (string_to_array(name, '/'))[1]
      AND cap.state IN ('draft', 'pending_payment')
  )
)
```

## 📋 Stappen

1. Run `storage_policies_route_a_correct.sql` in SQL Editor
2. Verifieer policy: `SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';`
3. Run smoke test: `npm run test:phase3b`
