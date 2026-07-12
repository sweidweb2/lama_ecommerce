/**
 * Seed a local admin account (auth user + profiles.role = admin).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * (loaded from .env.local via --env-file).
 *
 * Usage:
 *   npm run seed:admin
 */
import { createClient } from "@supabase/supabase-js";

const EMAIL = "admin@example.com";
const PASSWORD = "password";
const FULL_NAME = "Admin";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local`);
  }
  return value;
}

async function findUserByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function upsertAdminProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: FULL_NAME,
        role: "admin",
        is_active: true,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("profiles").insert({
    user_id: userId,
    full_name: FULL_NAME,
    role: "admin",
    is_active: true,
  });
  if (error) throw error;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let user = await findUserByEmail(supabase, EMAIL);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) throw error;
    if (!data.user) throw new Error("createUser returned no user");
    user = data.user;
    console.log(`Created auth user ${EMAIL}`);
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: FULL_NAME },
    });
    if (error) throw error;
    console.log(`Auth user ${EMAIL} already exists — password reset`);
  }

  await upsertAdminProfile(supabase, user.id);
  console.log(`Admin profile ready: ${EMAIL} / ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
