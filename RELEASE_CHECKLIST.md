# Release Checklist

## Phase 3B: Media Uploads - Release Gate

**Status:** ✅ **READY FOR PHASE 3C**

### Pre-Deployment Checklist

- [x] Storage RLS Policy configured and working
- [x] Photo uploads working (Supabase Storage)
- [x] Video uploads working (Supabase Storage)
- [x] Policy correctly blocks invalid uploads (403 on fake capsule IDs)
- [x] Finalize upload working
- [x] Capsule paths verified in database
- [x] Smoke test passing: `npm run test:phase3b`

### Smoke Test Results

Run before deploying:
```bash
npm run test:phase3b
```

**Expected:** 9/9 tests passed
- ✅ Create capsule
- ✅ Create photo upload
- ✅ Create video upload
- ✅ Supabase photo upload
- ✅ Supabase video upload
- ✅ Finalize photo upload
- ✅ Finalize video upload
- ✅ Verify capsule paths
- ✅ Policy blocks fake capsule IDs

### Supabase Storage Policy

**Policy Name:** "Allow uploads to capsules bucket (anon)"

**Location:** Supabase SQL Editor → "Capsules Bucket Upload Policy"

**Features:**
- ✅ Allows INSERT for anon users
- ✅ Path must contain `/photos/` or `/video/`
- ✅ Capsule must exist and be in `draft` or `pending_payment` state
- ✅ Blocks UPDATE/DELETE for anon (backend only)
- ✅ Uses security definer function for RLS bypass

### Production Polish

- ✅ Upload uses `upsert: false` (prevents overwriting)
- ✅ No DELETE/UPDATE policies for anon users
- ✅ Only backend service role can delete/update objects

---

## Next: Phase 3C (Payments)

Once all Phase 3B tests pass, proceed to Phase 3C implementation.
