--------------------------------------------------
-- Close open public INSERT on contact_us / leads
-- and add DB-backed form rate-limit counters.
--------------------------------------------------

-- Drop public insert policies (WITH CHECK true was spam-open via anon key)
drop policy if exists "Public can submit contact form" on contact_us;
drop policy if exists "Public can insert leads" on leads;

-- Rate-limit counters (service-role only; RLS on, no policies)
create table if not exists public.form_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  hit_count int not null default 0
);

alter table public.form_rate_limits enable row level security;
