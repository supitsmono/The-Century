# The Century

**A digital time capsule, sealed for 100 years.** Users write a message, attach photos and video, pay once, and the capsule is locked until its opening date.

![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express)
![Postgres](https://img.shields.io/badge/Postgres-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Checkout%20%2B%20webhooks-635BFF?logo=stripe&logoColor=white)

## Highlights

- **Multi-step sealing wizard** — message, media upload, review, payment, sealed confirmation
- **Payment-driven state machine** — `draft → pending_payment → paid → sealed`, with invalid transitions rejected server-side (`server/src/utils/stateMachine.ts`)
- **Stripe Checkout + webhooks** — including async payment methods (iDEAL, SEPA), cancel/timeout handling and reset-to-draft
- **Private media storage** — Supabase Storage bucket with row-level storage policies
- **Hardened API** — rate limiting, central error handling, validation
- **Release discipline** — phased build with written release gates and checklists (`PHASE3C_RELEASE_GATE.md`, `RELEASE_CHECKLIST.md`)

---

A time capsule application where users can create sealed capsules with photos, videos, and messages that will be opened in 100 years.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Supabase account (for storage)
- Stripe account (for payments)

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_BUCKET=capsules
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

   Frontend runs on `http://localhost:5173` (or port from Vite config)

### Backend Setup

See [server/README.md](./server/README.md) for detailed backend setup instructions.

**Quick setup:**
1. Set up PostgreSQL database (Supabase recommended)
2. Run migrations:
   - `server/src/db/migration_001_phase1.sql`
   - `server/src/db/migration_002_phase2.sql`
3. Set up Supabase Storage:
   - Create bucket `capsules` (private)
   - Run `server/src/db/storage_policies_route_a.sql` in Supabase SQL Editor
4. Create `.env` file in project root:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # Supabase Storage
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_BUCKET=capsules
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Server
   PORT=5001
   NODE_ENV=development
   ```

5. Start backend server:
   ```bash
   npm run server
   ```

   Backend runs on `http://localhost:5001` by default

## 📁 Project Structure

```
the-century/
├── components/          # React components
│   └── seal/           # Capsule wizard components
├── lib/                # Frontend utilities
│   ├── api.ts          # API client
│   ├── mediaUpload.ts  # Media upload helper
│   └── supabase.ts     # Supabase client
├── server/             # Backend Express server
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── db/          # Database migrations & policies
│       ├── routes/      # API routes
│       └── services/    # Business logic
└── scripts/            # Utility scripts
```

## 🧪 Testing

### Phase 3B: Media Uploads

**Release Gate:** Run before deploying Phase 3C
```bash
npm run test:phase3b
```

**Expected:** 9/9 tests passed
- All uploads working
- Policy correctly blocks invalid uploads

See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) for full checklist.

## 📚 Documentation

- [Backend Server README](./server/README.md) - Backend API documentation
- [Storage Policies](./server/src/db/storage_policies_route_a.sql) - Supabase Storage RLS policies

## 🛠️ Development

- `npm run dev` - Start frontend dev server
- `npm run server` - Start backend dev server
- `npm run build` - Build frontend for production
- `npm run server:build` - Build backend TypeScript

## 📝 Environment Variables

### Frontend (.env.local)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_BUCKET` - Storage bucket name (default: `capsules`)

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SUPABASE_BUCKET` - Storage bucket name
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PORT` - Server port (default: 5001)


---

Built by [Miguel](https://github.com/supitsmono) with an AI-assisted workflow: I own the product, architecture and decisions; AI coding tools write most of the code.
