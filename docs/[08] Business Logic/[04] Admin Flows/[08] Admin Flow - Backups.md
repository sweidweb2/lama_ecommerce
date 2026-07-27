# Admin Flow — Backups

**Scope:** Admin Backups from `flow.md`: `/admin/backups` ad-hoc extract download (+ cleanup of leftover metadata rows).  
**Out of scope:** In-app restore; uploading extracts to storage; external cron / Supabase dashboard backups; streaming multi-GB dumps without buffering.

**Verdict:** Page is an **Extract Database → local download** tool (SQL / JSON / CSV). Prefers `DATABASE_URL` / `SUPABASE_DB_URL` + **`pg_dump`** (SQL) or paginated **`pg`**. Falls back to Supabase service-role REST data export when no DB URL is set. Progress streams as NDJSON; UI checklist is locked until finish then auto-closes. No Create Backup UI / restore.

---

## Happy path (what works today)

1. Admin opens `/admin/backups` (middleware: auth + `role === admin`).
2. Page loads `getAllBackupsAdmin()` → leftover metadata rows (if any).
3. **Extract Database** → format menu (SQL / JSON / CSV) → locked progress dialog → `GET /api/admin/backups/extract?format=…` → admin-gated → `extractDatabase`:
   - Prefers `DATABASE_URL` or `SUPABASE_DB_URL`.
   - SQL + URL: tries `pg_dump --schema=public` when binary is on PATH; else paginated `pg`.
   - JSON/CSV + URL: paginated `pg` over all public tables.
   - No URL: Supabase OpenAPI table discovery + service-role paginated data export (data-only).
   - Streams NDJSON progress (`connect` → `discover` → `export` → `package` → `done`) then a `complete` event; browser downloads the file. Dialog auto-closes.
4. **Delete** on a listed row → `deleteBackupAction` → deletes metadata row only.

```text
/admin/backups
  → getAllBackupsAdmin → backups SELECT (cleanup list)
  → Extract: format menu → progress dialog
       → /api/admin/backups/extract?format=sql|json|csv
       → DATABASE_URL ? (pg_dump|pg) : supabase REST
       → NDJSON progress → local download → auto-close
  → Delete: DELETE metadata row only
  → No create UI; no restore; no row file Download
```

---

## P0 — Correctness (fix first)

- [x] ✅ **“Create Backup” is a stub; UI implies real backups / restore points** done✅  
  **Done:** Removed Create Backup dialog/button; page copy is extract-only (“Download a SQL export…”). No dump→storage wiring.

- [x] ✅ **No restore path at all** done✅  
  **Done:** Removed “restore points” language. Restore intentionally not offered.

---

## P1 — Incomplete / wrong backup behavior

- [x] ✅ **Extract is incomplete / unsafe as a full dump** done✅  
  **Where:** `repositories/backup.repository.ts`.  
  **Done:** Require `DATABASE_URL`/`SUPABASE_DB_URL` (no Supabase `knownTables` fallback). Prefer `pg_dump`; else paginated `pg` over all public tables with quoted identifiers. Fail closed without URL. `pg` path still omits indexes/FKs/RLS/triggers unless `pg_dump` ran — documented in SQL header.

- [x] ✅ **Delete / Download vs storage** done✅  
  Row Download (storage_path) removed from UI. Delete remains metadata-row cleanup only. No app storage writes.

- [x] ✅ **`createBackupSchema.parse` can throw** done✅  
  **Done:** `createBackupAdmin` uses `safeParse` + Result (`{ success: false, error }`).

- [ ] **Delete failure is silent in UI** (no toast; refresh only on success)  
  **Where:** `components/admin/backup/backups-table.tsx` `handleDelete`.  
  **Do:** Toast on failure; confirm before delete.

---

## P2 — DX / hygiene

- [ ] **`backups` missing from generated `types/supabase.ts`** → `(supabase as any)`.  
  **Do:** Regenerate types / add table.

- [ ] **Unused create action / list action** (create UI gone; page calls list service).  
  **Where:** `actions/backup.ts` / `services/backup.service.ts`.

- [ ] **Authz tests cover service layer only** (not extract route).  
  **Where:** `tests/feature/backup-admin-auth.test.ts`.

- [x] ✅ **`is_active` ignored for `/admin`** done✅ — shared auth P0 fixed (middleware + `requireAdmin`).

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| RLS on `backups` with **no policies**; app uses **service role** | Matches migration intent |
| Middleware + `canAccessAdmin` on extract API | Layered role gates work |
| No in-app restore | Intentional — local extract only |
| No create / storage upload in UI | Intentional — honest extract-only |
| Extract downloads live SQL, not tied to a `backups` row | Ad-hoc export by design |
| Leftover metadata rows + Delete | Cleanup only |
| `pg` fallback without indexes/policies | Use `pg_dump` on PATH for fuller dump |
| Entire dump buffered in memory | Multi-GB streaming deferred |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Non-admin `/admin/backups` | Middleware → `/` |
| Non-admin extract/delete | Forbidden / 403 |
| Extract with `DATABASE_URL` + `pg_dump` (SQL) | Fullest public-schema dump |
| Extract with `DATABASE_URL`, no `pg_dump` / JSON / CSV | Paginated `pg` tables + data (+ schema bits for SQL) |
| Extract without `DATABASE_URL` | Supabase REST data-only fallback (all public tables) |
| Empty metadata list | Empty copy points at Extract |
| Delete leftover row | Row gone |
| Delete failure | Silent (P1) |
| Restore | **N/A — not offered** |
| Create Backup UI | **Removed** |

---

## Key file map

| Concern | Path |
|---------|------|
| Page | `app/admin/backups/page.tsx` |
| Extract API | `app/api/admin/backups/extract/route.ts` |
| Actions | `actions/backup.ts` |
| Service | `services/backup.service.ts` |
| Repo / SQL dump | `repositories/backup.repository.ts` |
| UI | `components/admin/backup/backups-table.tsx` |
| Nav | `components/admin/app-sidebar.tsx`, `header.tsx` |
| Tests | `tests/feature/backup-admin-auth.test.ts` |

---

## DB / storage

| Mechanism | Role |
|-----------|------|
| `backups` table | Leftover metadata only; no create UI |
| App storage bucket | Not used by this page |
| `DATABASE_URL` / `SUPABASE_DB_URL` | Required for extract |
| `pg_dump` (optional) | Preferred extract path when on PATH |
| Extract API | Live SQL → browser download only |

---

## Related docs

- Index: `flow.md` (Admin → Backups)
- Auth gates: `[09] Admin Flow - Auth Session.md`, Guest Sign up

**Highest-impact remaining:** toast on delete failure; optional cleanup of unused create paths.
