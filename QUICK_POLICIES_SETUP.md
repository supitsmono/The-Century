# Quick Policies Setup

Policies worden aangemaakt via **SQL Editor**, niet via de Policies UI.

## 📝 Stap 1: SQL Editor (Niet Policies UI)

1. Ga naar **Supabase Dashboard** → **SQL Editor** (niet Storage → Policies)
2. Klik **New Query**
3. Open `server/src/db/storage_policies_route_a.sql`
4. Kopieer **hele bestand** (alle 56 regels)
5. Plak in SQL Editor
6. Klik **Run** (of Cmd/Ctrl + Enter)

## ✅ Stap 2: Verificatie (Na Run)

Na het runnen van het SQL script, check in **Storage → Policies**:

- ✅ Policy "Allow uploads to capsules bucket (anon)" is zichtbaar
- ✅ Policy staat op `storage.objects`
- ✅ Policy type: **INSERT**
- ✅ Policy is **enabled**

## ⚠️ Belangrijk

- **Policies UI** toont alleen policies (niet om ze aan te maken)
- **SQL Editor** is waar je policies aanmaakt
- Na SQL runnen, verschijnt policy automatisch in Policies UI
