# The Century - Project Samenvatting voor ChatGPT

## Project Overzicht

**The Century** is een time capsule applicatie waarbij gebruikers persoonlijke verhalen, foto's en video's kunnen "verzegelen" tot 2125 (100 jaar vanaf nu). Zodra een capsule is verzegeld, kan deze niet meer worden gewijzigd tot 2125.

## Technische Stack

### Backend
- **Runtime**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage (private bucket, EU Frankfurt)
- **Payments**: Stripe (Payment Intents + Webhooks)
- **Port**: 5001 (lokaal)

### Frontend
- **Framework**: React + Vite (TypeScript)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Port**: 5173 (lokaal)

## Architectuur

### State Machine (Backend)
Capsules hebben 4 states:
- `draft` - Gebruiker vult formulier in
- `pending_payment` - Wacht op betaling
- `paid` - Betaling ontvangen (via webhook)
- `sealed` - Capsule is verzegeld

**Belangrijk**: State transitions zijn strikt gereguleerd (draft → pending_payment → paid → sealed). Alleen webhooks kunnen naar `paid` transitionen.

### Database Schema (Supabase PostgreSQL)

**capsules tabel:**
- `id` (SERIAL PRIMARY KEY) - intern ID, nooit exposed
- `public_id` (UUID UNIQUE) - gebruikt in API/URLs
- `name`, `country`, `town`, `dob`, `message` - gebruikersdata
- `photos_paths` (TEXT[]) - Supabase Storage paths (Phase 2)
- `video_path` (TEXT) - Supabase Storage path (Phase 2)
- `photos_meta`, `video_meta` (JSONB) - metadata (size, mime, etc.)
- `open_at` (TIMESTAMPTZ) - wanneer capsule opent (2125-01-01 default)
- `state` (ENUM) - draft/pending_payment/paid/sealed
- `payment_id` (TEXT) - Stripe payment intent ID
- `email` (TEXT) - optioneel
- `created_at`, `age_at_creation` - timestamps

**Legacy fields (DEPRECATED maar nog aanwezig):**
- `photos` (TEXT[]) - was base64, nu leeg
- `video` (TEXT) - was base64, nu null

### API Endpoints

**Capsules:**
- `POST /api/capsules` - Maak nieuwe capsule (draft state)
- `GET /api/capsules/:public_id` - Haal capsule op

**Media (Phase 2):**
- `POST /api/capsules/media/create-upload` - Genereer signed upload URL
- `POST /api/capsules/media/finalize-upload` - Link uploaded file aan capsule
- `POST /api/capsules/media/remove` - Verwijder media

**Payments:**
- `POST /api/payments/create-intent` - Maak Stripe payment intent
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/confirm` - Test endpoint (development only)

## Wat is Tot Nu Toe Gebouwd

### Phase 1: Backend Foundation ✅
- Database schema + migrations
- State machine met strikte transitions
- Stripe Payment Intents integratie
- Webhook verificatie + idempotency
- Zod validation schemas
- Rate limiting
- Public ID privacy (nooit intern ID exposed)
- Error handling + logging

### Phase 2: Supabase Storage ✅
- Database migration: `photos_paths`, `video_path`, metadata fields
- Supabase Storage integratie (private bucket)
- Media upload endpoints (create-upload, finalize-upload, remove)
- File validation (mime types, sizes, counts via env vars)
- Object existence checks
- Path generation (format: `{public_id}/photos/{uuid}.{ext}`)

### Phase 3A: Frontend Integratie (IN PROGRESS)
**Doel**: Verwijder localStorage, connect frontend aan backend, implementeer URL persistence

**Status**: Begonnen, maar nog niet compleet
- ✅ Types mapping (lib/capsuleMapping.ts)
- ✅ localStorage verwijderd uit App.tsx
- ✅ API client module (lib/api.ts)
- ⏳ URL persistence (`?capsule=<public_id>`)
- ⏳ Hydration (getCapsule → hydrate state)
- ⏳ Create capsule flow (pas wanneer fields compleet zijn)

## Huidige Situatie & Uitdagingen

### Frontend Wizard Flow
De wizard heeft 6 stappen:
1. **Step 1 (Identity)**: name, country, town, dob (day/month/year)
2. **Step 2 (Photos)**: Upload foto's
3. **Step 3 (Video)**: Upload video
4. **Step 4 (Message)**: Schrijf message
5. **Step 5 (Review)**: Review alles + "Seal" button
6. **Step 6 (Certificate)**: Success scherm

### Belangrijke Constraints

1. **Backend Validatie**: 
   - `country`, `town`, `dob`, `message` zijn **required** (`.min(1)` in Zod)
   - **GEEN placeholder capsules** - dit zou junk data creëren
   - Create capsule pas wanneer ALLE vereiste fields compleet zijn

2. **Media Uploads**:
   - Media endpoints vereisen `capsulePublicId`
   - Media uploads kunnen pas plaatsvinden NA capsule creation
   - UX flow: Basis invullen → Capsule maken → Media uploads → Betalen

3. **URL Persistence**:
   - Gebruik `?capsule=<public_id>` query param
   - Als param bestaat: hydrate state van backend
   - Als param NIET bestaat: frontend-only draft in state
   - Zodra capsule is aangemaakt: set query param, behoud bij step navigation

4. **StrictMode**:
   - React StrictMode in development (double mount)
   - Prevent dubbele create calls met `useRef` flag

### Huidige Probleem

We zijn bezig met Phase 3A implementatie, maar moeten beslissen over:

**Wanneer capsule maken?**
- Optie A: Bij "Next" van Step 1 (maar message ontbreekt nog → kan niet)
- Optie B: Bij "Next" van Step 4 (alle required fields compleet)
- Optie C: Bij "Seal" button in Step 5 (laatste mogelijkheid)

**ChatGPT's aanbeveling was**: Pas wanneer alle required fields compleet zijn (country, town, dob, message) - dus optie B of C.

## Environment Variables

### Backend (.env in project root)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=capsules
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=5001
NODE_ENV=development
MAX_PHOTOS=12
MAX_PHOTO_MB=5
MAX_VIDEO_MB=50
ALLOWED_IMAGE_MIMES=image/jpeg,image/png,image/webp
ALLOWED_VIDEO_MIMES=video/mp4,video/webm
```

### Frontend (nog niet geconfigureerd)
```
VITE_API_URL=http://localhost:5001
```

## Bestanden Structuur

```
the-century/
├── App.tsx                    # Main app, routing
├── components/
│   ├── seal/
│   │   ├── CapsuleWizard.tsx  # Main wizard component (moet aangepast)
│   │   ├── hooks/
│   │   │   └── useWizardState.ts  # Wizard state management
│   │   └── steps/
│   │       ├── Step1Identity.tsx
│   │       ├── Step2Photos.tsx
│   │       ├── Step3Video.tsx
│   │       ├── Step4Message.tsx
│   │       ├── Step5Review.tsx
│   │       └── Step6Certificate.tsx
│   ├── HomePage.tsx
│   └── VaultPage.tsx
├── lib/
│   ├── api.ts                 # API client (✅ compleet)
│   └── capsuleMapping.ts      # Backend ↔ UI mapping (✅ compleet)
├── types.ts                   # Frontend types
├── server/
│   ├── src/
│   │   ├── controllers/       # API handlers
│   │   ├── db/                # Database schema + migrations
│   │   ├── routes/            # Express routes
│   │   ├── services/          # Storage service
│   │   ├── types/             # Backend types
│   │   └── validation/        # Zod schemas
│   └── PHASE2_SUMMARY.md
└── package.json
```

## Belangrijke Code Snippets

### Capsule Create Request (Backend vereist)
```typescript
{
  capsule: {
    country: string;      // Required, min(1)
    town: string;         // Required, min(1)
    dob: string;          // Required, format: YYYY-MM-DD
    message: string;      // Required, min(1)
    name?: string;        // Optional
    openAt?: string;      // Optional, ISO datetime
    ageAtCreation?: number; // Optional
  },
  email?: string;
}
```

### Wizard State Format (Frontend)
```typescript
{
  formData: {
    name: string;
    country: string;
    town: string;
    message: string;
  },
  dobDay: string;        // "1" - "31"
  dobMonth: string;      // "January" - "December"
  dobYear: string;       // "1900" - "2024"
  photos: string[];      // Voor nu: base64 (Phase 3B wordt storage paths)
  videoBase64: string | null;
  // ... andere fields
}
```

### Date Conversion
- **Frontend → Backend**: `dobDay + dobMonth + dobYear` → `YYYY-MM-DD`
  - Format: `${dobYear}-${MONTHS.indexOf(dobMonth) + 1}-${dobDay}` (met padding)
- **Backend → Frontend**: `YYYY-MM-DD` → parse naar `dobDay`, `dobMonth`, `dobYear`

## Next Steps (Phase 3A)

1. **URL Persistence**: Implementeer `useSearchParams()` voor `?capsule=<public_id>`
2. **Hydration**: Als `?capsule=` bestaat → `getCapsule()` → hydrate wizard state
3. **Create Capsule**: Wanneer fields compleet zijn (na Step 4 of bij Seal)
4. **Step Navigation**: Behoud `?capsule=` param bij step changes
5. **Error Handling**: Loading states, error states, StrictMode guard

## Phase 3B (Volgende - Media Uploads)
- Supabase client-side uploads
- Replace base64 met storage paths in wizard
- Upload progress + error handling

## Phase 3C (Daarna - Payments)
- Stripe Elements integratie
- Payment flow met polling
- State updates via webhooks

## Belangrijke Design Decisions

1. **Geen user accounts**: Capsules zijn anoniem, geïdentificeerd via `public_id`
2. **Public ID privacy**: Nooit intern `id` exposed, altijd `public_id`
3. **State machine**: Strikt gereguleerde transitions, webhooks zijn source of truth
4. **Storage**: Private bucket + signed URLs (geen public access)
5. **Media**: Phase 2 migratie van base64 naar storage paths
6. **Validation**: Zod schemas voor type safety + runtime validation

## Contact / Hulp Nodig

We hebben hulp nodig met:
- Phase 3A implementatie (URL persistence + hydration + create flow)
- Beslissing: wanneer capsule maken? (Step 4 of Step 5?)
- Code review van huidige implementatie
- Best practices voor React Router v7 + useSearchParams
