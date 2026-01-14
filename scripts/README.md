# Test Scripts

## Phase 3B Media Upload Smoke Test

Automated test for the complete media upload pipeline.

### Prerequisites

- Backend server running on `http://localhost:5001` (or set `API_URL` env var)
- Database configured and migrations applied
- Supabase Storage configured (bucket, service role key)

### Run

```bash
npm run test:phase3b
```

Or directly:

```bash
npx tsx scripts/smoke-phase3b-media.ts
```

### What it tests

1. ✅ Create capsule via POST `/api/capsules`
2. ✅ Create photo upload via POST `/api/capsules/media/create-upload`
3. ✅ Create video upload via POST `/api/capsules/media/create-upload`
4. ✅ PUT upload photo to signed URL
5. ✅ PUT upload video to signed URL
6. ✅ Finalize photo upload via POST `/api/capsules/media/finalize-upload`
7. ✅ Finalize video upload via POST `/api/capsules/media/finalize-upload`
8. ✅ Verify capsule paths via GET `/api/capsules/:public_id`
9. (Optional) Remove media via POST `/api/capsules/media/remove`

### Output

The script prints:
- ✅/❌ for each step
- Error messages on failure
- Final summary with pass/fail count
- Exit code 0 on success, 1 on failure
