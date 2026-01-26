create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  created_at timestamptz default now()
);
