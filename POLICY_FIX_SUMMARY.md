# Policy Fix Summary

## 🔍 Probleem

Smoke test faalt met **403: "new row violates row-level security policy"**.

**Mogelijke oorzaken:**
1. Policy script is niet correct uitgevoerd (geen policies aangemaakt)
2. Policy script heeft een bug (verkeerde syntax: `storage.objects.name` i.p.v. `name`)

## 🔧 Fix

**Versie gebruikt**: `storage_policies_route_a_clean.sql` (heeft BUG: gebruikt `storage.objects.name`)

**Fixed versie**: `storage_policies_route_a_fixed.sql` (gebruikt `name` - correct)

### Verschil

**Oud (FOUT)**:
```sql
WHERE c.public_id::text = split_part((storage.objects.name)::text, '/', 1)
```

**Nieuw (CORRECT)**:
```sql
WHERE c.public_id::text = split_part(name, '/', 1)
```

## 📋 Stappen

### 1. Run Fixed Policy Script

**In Supabase SQL Editor:**
1. Open `server/src/db/storage_policies_route_a_fixed.sql`
2. Kopieer hele bestand
3. Plak in SQL Editor
4. Klik **Run**
5. Als waarschuwing "destructive operation" → klik **Confirm**

### 2. Verificeer Policy Bestaat

Run deze query in SQL Editor:
```sql
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

**Verwacht**: Je ziet policy "Allow uploads to capsules bucket (anon)"

### 3. Check RLS is Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

**Verwacht**: `rowsecurity = true`

### 4. Run Smoke Test Opnieuw

```bash
npm run test:phase3b
```

**Verwacht**: Stap 3a (Supabase photo upload) zou nu ✅ moeten zijn.
