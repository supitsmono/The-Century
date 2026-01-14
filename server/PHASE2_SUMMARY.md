# Phase 2 Summary - Supabase Storage Integration

## ✅ Wat is geïmplementeerd

### Database
- ✅ Migration script (`migration_002_phase2.sql`)
- ✅ Nieuwe velden: `photos_paths`, `photos_meta`, `video_path`, `video_meta`
- ✅ Indexen voor storage paths
- ✅ Legacy velden blijven (backward compatibility)

### Storage Service
- ✅ Supabase Storage integratie (`storageService.ts`)
- ✅ Path generatie (`generateStoragePath`)
- ✅ Object-exists check (`verifyObjectExists` - HEAD/list)
- ✅ Metadata ophalen (`getObjectMetadata`)
- ✅ Object verwijderen (`deleteObject`)
- ✅ Signed download URLs (`createSignedDownloadUrl`)

**Route A (Client-side Supabase SDK)**: Upload flow gebruikt Supabase SDK met anon key + Storage policies.

### Media Controller
- ✅ Create upload endpoint (`createUpload`)
  - Valideert capsule bestaat
  - Checkt photo limit
  - Genereert storage path
  - Retourneert path + metadata
  
- ✅ Finalize upload endpoint (`finalizeUpload`)
  - Object-exists check (HEAD/list)
  - Metadata validatie
  - Idempotent (zelfde path kan meerdere keren worden gefinaliseerd)
  - Update capsule met paths + metadata
  
- ✅ Remove media endpoint (`removeMedia`)
  - Verwijderd uit database
  - Verwijderd uit storage (best effort)

### Validation
- ✅ Media schemas (`mediaSchemas.ts`)
- ✅ Environment variable limits (MAX_PHOTOS, MAX_PHOTO_MB, MAX_VIDEO_MB, MIME types)
- ✅ Zod validatie voor alle endpoints

### Routes
- ✅ `/api/capsules/media/create-upload`
- ✅ `/api/capsules/media/finalize-upload`
- ✅ `/api/capsules/media/remove`

### Capsule Controller
- ✅ Updated `createCapsule`: start met lege `photos_paths`/`video_path`
- ✅ Updated `getCapsule`: retourneert storage paths + metadata
- ✅ Backward compatibility: legacy velden blijven bestaan

### Documentation
- ✅ `PHASE2_SETUP.md` (complete setup guide + smoke test)
- ✅ Cleanup/retry policy gedocumenteerd
- ✅ Object-exists check gedocumenteerd
- ✅ Environment variables gedocumenteerd

---

## 🔄 Cleanup/Retry Policy

### Scenario 1: Create-upload gedaan, upload faalt
- **Actie**: Client kan nieuwe `create-upload` doen (nieuw path)
- **Resultaat**: Oude path blijft orphan
- **TODO**: Orphan cleanup job later

### Scenario 2: Upload lukt, finalize-upload faalt
- **Actie**: Client kan `finalize-upload` opnieuw aanroepen (zelfde path)
- **Resultaat**: Idempotent (zelfde path kan meerdere keren worden gefinaliseerd)
- **Check**: Object-exists check voorkomt finalize zonder upload

---

## ⚠️ Known Limitations / TODO

1. **Orphan Cleanup**: Orphan paths in storage worden niet automatisch opgeruimd
   - **TODO**: Periodic cleanup job (bijv. dagelijks)

2. **Bucket Region**: Bucket moet handmatig worden aangemaakt in EU (Frankfurt) via Supabase Dashboard

## ✅ Route A Implementation (COMPLEET)

**Upload Flow**:
- ✅ Client-side Supabase SDK upload (anon key)
- ✅ Storage RLS policies (`storage_policies_route_a.sql`)
- ✅ Backend `create-upload` endpoint (path generation + validation)
- ✅ Backend `finalize-upload` endpoint (link path to capsule)
- ✅ Frontend upload helper (`lib/mediaUpload.ts`)
- ✅ Smoke test (`scripts/smoke-phase3b-media.ts`)

**Storage Policies**:
- ✅ INSERT policy: alleen voor geldige capsules in `draft`/`pending_payment` state
- ✅ Path validatie: `{public_id}/photos/...` of `{public_id}/video/...`
- ✅ Capsule exists check: path moet matchen met bestaande capsule
- ✅ State check: alleen `draft` en `pending_payment` toestaan uploads

---

## 📋 Environment Variables

```env
# Supabase Storage (Route A: Client-side SDK)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Backend only (service role)
SUPABASE_ANON_KEY=eyJ...  # Frontend + smoke test (anon/public key)
SUPABASE_BUCKET=capsules  # Optional

# Media Limits
MAX_PHOTOS=12
MAX_PHOTO_MB=5
MAX_VIDEO_MB=50
ALLOWED_IMAGE_MIMES=image/jpeg,image/png,image/webp
ALLOWED_VIDEO_MIMES=video/mp4,video/webm
```

---

## 🧪 Smoke Test

Zie `scripts/smoke-phase3b-media.ts` voor complete smoke test:
1. Create capsule
2. Create upload (photo + video)
3. Upload to Supabase Storage via SDK
4. Finalize upload
5. Verify capsule paths
6. Test policy: fake capsuleId upload should fail (403)

---

## ✅ Phase 2 Status: COMPLEET (Route A geïmplementeerd)

**Kernfunctionaliteit**: ✅
- Database migratie
- Storage service
- Media endpoints (Route A: Supabase SDK)
- Storage RLS policies
- Validation
- Object-exists check
- Idempotency
- Cleanup/retry policy
- Frontend upload helper
- Smoke test

**TODOs**:
- ⚠️ Orphan cleanup job (periodieke cleanup)

**Volgende stap**: Upload endpoint implementeren of client-side upload met Supabase SDK.
