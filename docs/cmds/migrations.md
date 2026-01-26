# Supabase Migration Commands

Quick reference for database migrations and type generation.

## Create a New Migration

```bash
npx supabase migration new add_products
```

This creates a new migration file in `supabase/migrations/` with a timestamp prefix.

## Edit Migration SQL

After creating the migration, edit the SQL file in `supabase/migrations/` directory.

## Apply Migrations

```bash
npx supabase db push
```

Pushes all pending migrations to your Supabase project.

## View Database

Use the **Supabase web dashboard** (Table Editor) to view and manage your database tables.

## Generate TypeScript Types

Generate TypeScript types from your Supabase database schema:

```bash
npx supabase gen types typescript \
  --project-id otyrgqvrvsovmlfaezrn \
  > types/supabase.ts
```

**Note:** Replace `otyrgqvrvsovmlfaezrn` with your actual Supabase project ID if different.

## Common Workflow

1. Create migration: `npx supabase migration new migration_name`
2. Edit SQL file in `supabase/migrations/`
3. Apply migration: `npx supabase db push`
4. Generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`
5. Verify in Supabase dashboard
