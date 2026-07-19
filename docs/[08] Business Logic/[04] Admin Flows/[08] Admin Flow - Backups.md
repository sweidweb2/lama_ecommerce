# Admin Flow — Backups

**Scope:** Admin Backups from `flow.md`: `/admin/backups` metadata CRUD + database extract download.  
**Out of scope:** External cron / infra backups outside this app; Supabase dashboard backups.

**Verdict:** **Not production backup/restore.** Working pieces are **metadata CRUD** + **ad-hoc SQL extract download**. “Create Backup” does **not** dump data; **restore does not exist**; row Download only works if `storage_path` is set (UI create never sets it).

---

## Happy path (what works today)

1. Admin opens `/admin/backups` (middleware: auth + `role === admin`).
2. Page loads `getAllBackupsAdmin()` → service-role `backups` SELECT (newest first).
3. **Create Backup** dialog → `createBackupAction` → inserts metadata (`name`, `type`, optional `size`; `storage_path` null).
4. Table shows row; **Download** disabled (no `storage_path`).
5. **Extract Database** → `GET /api/admin/backups/extract` → admin-gated → SQL string → browser download (`database-export-….sql`).
6. **Delete** → `deleteBackupAction` → deletes **row only** (no storage file cleanup).

```text
/admin/backups
  → getAllBackupsAdmin → backups SELECT (admin client)
  → Create: metadata INSERT only (no dump, no storage write)
  → Extract: /api/admin/backups/extract → SQL dump (pg or Supabase fallback)
  → Download row: only if storage_path set (never by create UI)
  → Delete: DELETE row only
  → Restore: missing
```

---

## P0 — Correctness (fix first)

- [ ] **“Create Backup” is a stub; UI implies real backups / restore points**  
  Service comment: “Actual backup generation is external.” Dialog only writes `backups` metadata. Page copy mentions restore points.  
  **Where:** `services/backup.service.ts`; `components/admin/backup/create-backup-dialog.tsx`; `backups-table.tsx`.  
  **Do:** Wire real dump → storage → set `storage_path`, or rename UI to “Register backup metadata” / hide create until cron exists.

- [ ] **No restore path at all**  
  No action/service/API/UI for restore despite product copy.  
  **Where:** `app/admin/backups/**`, `actions/backup.ts`, `services/backup.service.ts`.  
  **Do:** Implement restore, or remove “restore points” language until then.

---

## P1 — Incomplete / wrong backup behavior

- [ ] **Extract is incomplete / unsafe as a restore artifact**  
  - Fallback `knownTables` can miss tables (e.g. `form_rate_limits`).  
  - Supabase `.select("*")` default ~1000-row cap → truncated dumps.  
  - No FKs/indexes/RLS/triggers; identifiers/JSON may stringify poorly.  
  - Prefer `DATABASE_URL`/`pg` when set; else hard-coded enums/tables.  
  **Where:** `repositories/backup.repository.ts` (`extractWithPostgresClient` / `extractWithSupabaseClient`).  
  **Do:** Prefer `pg_dump` (or equivalent); paginate; include schema+data+policies; fail closed if incomplete.

- [ ] **Delete does not delete a backup file; Download usually dead**  
  Create never sets `storage_path`; delete only removes DB row.  
  **Where:** `create-backup-dialog.tsx`; `deleteBackup`; download branch in `backups-table.tsx`.  
  **Do:** Store file in bucket; set `storage_path`; on delete remove object + row; or hide Download until path exists.

- [ ] **`createBackupSchema.parse` can throw** (opaque action failure)  
  **Where:** `services/backup.service.ts` (`createBackupAdmin`).  
  **Do:** `safeParse` + `{ success: false, error }`.

- [ ] **Delete failure is silent in UI** (no toast; refresh only on success)  
  **Where:** `components/admin/backup/backups-table.tsx` `handleDelete`.  
  **Do:** Toast on failure; confirm before delete.

---

## P2 — DX / hygiene

- [ ] **`backups` missing from generated `types/supabase.ts`** → `(supabase as any)`.  
  **Do:** Regenerate types / add table.

- [ ] **`getAllBackupsAction` unused** (page calls service directly).  
  **Where:** `actions/backup.ts`.

- [ ] **Authz tests cover service layer only** (not extract route).  
  **Where:** `tests/feature/backup-admin-auth.test.ts`.

- [x] ✅ **`is_active` ignored for `/admin`** done✅ — shared auth P0 fixed (middleware + `requireAdmin`).

---

## Deferred / works-as-implemented

| Behavior | Why OK / deferred |
|----------|-------------------|
| RLS on `backups` with **no policies**; app uses **service role** | Matches migration intent |
| Middleware + `canAccessAdmin` on extract API | Layered role gates work |
| `full` / `incremental` as metadata labels only | OK if documented as labels, not dump modes |
| No cron / external backup writer in repo | Deferred ops; UI still misleading (P0) |
| Extract downloads live SQL, not tied to a `backups` row | Works as ad-hoc export if quality limits accepted |

---

## Edge-case matrix

| Edge case | Status |
|-----------|--------|
| Non-admin `/admin/backups` | Middleware → `/` |
| Non-admin create/delete/extract | Forbidden / 403 |
| Create without name | Client / Zod reject |
| Create with size only | Metadata row; download disabled |
| Download with null `storage_path` | Disabled |
| Download with absolute URL in `storage_path` | Opens raw URL (no app auth) |
| Delete success | Row gone; no storage cleanup |
| Delete failure | Silent (P1) |
| Extract without `DATABASE_URL` | Supabase fallback (partial) |
| Large tables via fallback | Truncated (P1) |
| Restore from listed backup | **N/A — not implemented** (P0) |

---

## Key file map

| Concern | Path |
|---------|------|
| Page | `app/admin/backups/page.tsx` |
| Extract API | `app/api/admin/backups/extract/route.ts` |
| Actions | `actions/backup.ts` |
| Service | `services/backup.service.ts` |
| Repo / SQL dump | `repositories/backup.repository.ts` |
| UI | `components/admin/backup/*` |
| Validator | `lib/validators/backup/create.ts` |
| Nav | `components/admin/app-sidebar.tsx`, `header.tsx` |
| Tests | `tests/feature/backup-admin-auth.test.ts` |

---

## DB / storage

| Mechanism | Role |
|-----------|------|
| `backups` table | Metadata only (`name`, `type`, `size`, `storage_path`, timestamps) |
| Storage bucket | Intended for files; create UI never writes |
| Extract API | Live SQL download; not stored as a backup row |

---

## Related docs

- Index: `flow.md` (Admin → Backups)
- Auth gates: `[09] Admin Flow - Auth Session.md`, Guest Sign up

**Highest-impact fixes:** honest UI (metadata vs real backup) → dump→storage→download → restore or remove restore copy → `pg_dump`-quality extract.
