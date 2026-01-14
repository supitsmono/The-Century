# Phase 2 Setup Guide - Supabase Storage Integration

Complete guide voor het opzetten van Phase 2: Supabase Storage integratie voor foto/video uploads.

## 🎯 Wat Phase 2 doet

- ✅ Verwijderd: Base64 media opslag in database
- ✅ Toegevoegd: Supabase Storage voor foto/video
- ✅ Nieuwe velden: `photos_paths`, `video_path`, metadata (JSONB)
- ✅ Media endpoints: create-upload, finalize-upload, remove-media
- ✅ Object-exists check bij finalize (HEAD/list)
- ✅ Idempotente finalize-upload
- ✅ Cleanup/retry policy gedocumenteerd
- ✅ Media limits via environment variables

---

## 📋 Stap 1: Supabase Storage Setup

### 1.1 Bucket aanmaken

1. Ga naar Supabase Dashboard → **Storage**
2. Klik **New bucket**
3. Configureer:
   - **Name**: `capsules` (of gebruik `SUPABASE_BUCKET` env var)
   - **Public bucket**: ❌ **OFF** (private bucket)
   - **File size limit**: 50MB (of hoger voor video)
   - **Allowed MIME types**: `image/*,video/*` (optioneel, server valideert ook)
   - **Region**: **EU (Frankfurt)** (of andere EU region)

### 1.2 Storage Policies (VERPLICHT voor Route A)

Voor client-side uploads (Route A: Supabase SDK) zijn Storage RLS policies **verplicht**.

Voer het Storage policies SQL script uit:

1. Ga naar **SQL Editor** in Supabase dashboard
2. Open `server/src/db/storage_policies_route_a.sql`
3. Kopieer heel bestand
4. Plak in SQL Editor
5. Klik **Run**

**Wat de policies doen**:
- Toestaan INSERT (upload) alleen als:
  - Bucket is `capsules`
  - Path volgt structuur: `{public_id}/photos/...` of `{public_id}/video/...`
  - `public_id` bestaat in `capsules` tabel
  - Capsule state is `draft` of `pending_payment`
- Blokkeren UPDATE/DELETE (alleen via backend service role)
- Blokkeren SELECT (private bucket; downloads via backend signed URLs)

---

## 🔧 Stap 2: Environment Variables

Voeg toe aan `.env` (project root):

```env
# Supabase Storage (Phase 2 - Route A: Client-side SDK)
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Van Supabase Settings → API → service_role key (backend only)
SUPABASE_ANON_KEY=eyJ...  # Van Supabase Settings → API → anon/public key (frontend + smoke test)
SUPABASE_BUCKET=capsules  # Optional, default is "capsules"

# Media Limits (Phase 2)
MAX_PHOTOS=12  # Maximum aantal foto's per capsule
MAX_PHOTO_MB=5  # Maximum grootte per foto (MB)
MAX_VIDEO_MB=50  # Maximum grootte per video (MB)
ALLOWED_IMAGE_MIMES=image/jpeg,image/png,image/webp  # Toegestane image MIME types
ALLOWED_VIDEO_MIMES=video/mp4,video/webm  # Toegestane video MIME types
```

**Belangrijk**: `SUPABASE_SERVICE_ROLE_KEY` heeft full access. **NOOIT** delen of committen!

---

## 🗄️ Stap 3: Database Migratie

Voer de Phase 2 migratie uit in Supabase SQL Editor:

1. Ga naar **SQL Editor** in Supabase dashboard
2. Open `server/src/db/migration_002_phase2.sql`
3. Kopieer hele bestand
4. Plak in SQL Editor
5. Klik **Run**

**Wat de migratie doet**:
- Voegt `photos_paths` (TEXT[]) toe
- Voegt `photos_meta` (JSONB) toe
- Voegt `video_path` (TEXT) toe
- Voegt `video_meta` (JSONB) toe
- Voegt indexen toe
- Legacy velden (`photos`, `video`) blijven bestaan (deprecated)

---

## 🔄 Stap 4: Backend Restart

```bash
cd server
npm run server
```

Check logs voor:
- ✅ "Server running on port 5001"
- ⚠️ Geen "Supabase Storage not configured" warning

---

## 📝 Stap 5: API Endpoints

### Media Endpoints

**Base URL**: `/api/capsules/media`

#### 1. Create Upload

```bash
POST /api/capsules/media/create-upload
Content-Type: application/json

{
  "capsulePublicId": "uuid-here",
  "kind": "photo",  # of "video"
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 1024000
}
```

**Response**:
```json
{
  "path": "uuid/photos/uuid.jpg",
  "kind": "photo",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 1024000
}
```

**Note**: The `path` is the object key within the bucket (without bucket name prefix). The bucket name `capsules` is specified separately in the Supabase Storage API.

**Route A (Client-side Supabase SDK Upload)**:
1. Call `create-upload` to get validated `path`
2. Upload file directly via Supabase SDK: `supabase.storage.from('capsules').upload(path, file, { contentType, upsert: false })`
3. Call `finalize-upload` to link path to capsule

**Storage Policies**: Must allow INSERT (upload) for paths matching valid capsules in `draft`/`pending_payment` state. See `storage_policies_route_a.sql`.

#### 2. Finalize Upload

```bash
POST /api/capsules/media/finalize-upload
Content-Type: application/json

{
  "capsulePublicId": "uuid-here",
  "kind": "photo",
  "path": "uuid/photos/uuid.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 1024000
}
```

**Note**: The `path` is the object key within the bucket (without `capsules/` prefix). This matches the path returned by `create-upload`.
```

**Response**:
```json
{
  "message": "Upload finalized successfully",
  "path": "uuid/photos/uuid.jpg",
  "kind": "photo"
}
```

**Idempotent**: Kan meerdere keren worden aangeroepen met dezelfde `path`.

**Object-exists check**: Verifieert dat bestand bestaat in storage (HEAD/list).

#### 3. Remove Media

```bash
POST /api/capsules/media/remove
Content-Type: application/json

{
  "capsulePublicId": "uuid-here",
  "kind": "photo",
  "path": "uuid/photos/uuid.jpg"
}
```
```

**Response**:
```json
{
  "message": "Media removed successfully",
  "path": "uuid/photos/uuid.jpg",
  "kind": "photo"
}
```

---

## 🧪 Stap 6: Smoke Test

### Test Flow

1. **Create capsule** (zonder media):
   ```bash
   curl -X POST http://localhost:5001/api/capsules \
     -H "Content-Type: application/json" \
     -d '{
       "capsule": {
         "country": "Netherlands",
         "town": "Amsterdam",
         "dob": "2000-01-01",
         "message": "Test message",
         "photos": [],
         "ageAtCreation": 25,
         "openAt": "2125-01-01T00:00:00Z"
       }
     }'
   ```
   
   **Verwacht**: `{"public_id": "...", "message": "Capsule created successfully"}`

2. **Create upload** (photo):
   ```bash
   curl -X POST http://localhost:5001/api/capsules/media/create-upload \
     -H "Content-Type: application/json" \
     -d '{
       "capsulePublicId": "<public_id_from_step_1>",
       "kind": "photo",
       "fileName": "test.jpg",
       "mimeType": "image/jpeg",
       "fileSizeBytes": 1024
     }'
   ```
   
   **Verwacht**: `{"path": "...", "uploadUrl": "...", ...}`

3. **Upload file via Supabase SDK** (Route A):
   ```javascript
   // Frontend/client-side
   const { data, error } = await supabase.storage
     .from('capsules')
     .upload(path, file, {
       contentType: 'image/jpeg',
       upsert: false,
     });
   ```
   
   **Of gebruik de smoke test** (zie `scripts/smoke-phase3b-media.ts`):
   ```bash
   npm run test:phase3b
   ```
   
   **Verwacht**: Upload succesvol (Storage policies controleren toegang)

4. **Finalize upload**:
   ```bash
   curl -X POST http://localhost:5001/api/capsules/media/finalize-upload \
     -H "Content-Type: application/json" \
     -d '{
       "capsulePublicId": "<public_id_from_step_1>",
       "kind": "photo",
       "path": "<path_from_step_2>",
       "mimeType": "image/jpeg",
       "fileSizeBytes": 1024
     }'
   ```
   
   **Verwacht**: `{"message": "Upload finalized successfully", ...}`

5. **Get capsule** (check paths):
   ```bash
   curl http://localhost:5001/api/capsules/<public_id_from_step_1>
   ```
   
   **Verwacht**: `{"photos_paths": ["..."], "photos_meta": [...], ...}`

---

## 🔄 Cleanup/Retry Policy

### Scenario 1: Create-upload gedaan, maar upload faalt

**Actie**: Client kan nieuwe `create-upload` doen (nieuw path).
**Resultaat**: Oude path blijft orphan in storage.
**TODO**: Orphan cleanup job later (periodieke job die oude paths opruimt).

### Scenario 2: Upload lukt, maar finalize-upload faalt

**Actie**: Client kan `finalize-upload` opnieuw aanroepen (zelfde path).
**Resultaat**: Endpoint is idempotent (zelfde path kan meerdere keren worden gefinaliseerd).
**Check**: Object-exists check voorkomt finalize zonder upload.

---

## ⚠️ Known Limitations

1. **Orphan Cleanup**: Orphan paths in storage worden niet automatisch opgeruimd (TODO: cleanup job).
2. **Storage Policies**: Policies moeten handmatig worden aangemaakt via SQL Editor (zie `storage_policies_route_a.sql`).

---

## ✅ Phase 2 Status

- ✅ Database migratie (`migration_002_phase2.sql`)
- ✅ Storage service (`storageService.ts`)
- ✅ Media controller (`mediaController.ts`)
- ✅ Media routes (`/api/capsules/media`)
- ✅ Validation schemas (`mediaSchemas.ts`)
- ✅ Environment variables
- ✅ Object-exists check
- ✅ Idempotente finalize
- ⚠️ Upload endpoint (TODO: proxy of client-side)
- ⚠️ Orphan cleanup (TODO: periodic job)

**Volgende stap**: Upload endpoint implementeren of client-side upload met Supabase SDK.
