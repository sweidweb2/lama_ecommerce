-- Link newsletter leads to auth users when subscribed while logged in.
-- Nullable: guests remain user_id null; ON DELETE SET NULL if account removed.

alter table public.leads
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists idx_leads_user_id on public.leads (user_id);
