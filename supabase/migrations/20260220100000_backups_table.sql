--------------------------------------------------
-- Backups (metadata for admin backup/restore points)
--------------------------------------------------

create table backups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('full', 'incremental')),
  size text,
  storage_path text,
  created_at timestamptz default now()
);

create index idx_backups_created_at on backups(created_at desc);

alter table backups enable row level security;

-- Only service role (admin client) is used for backup operations; no public policies.
