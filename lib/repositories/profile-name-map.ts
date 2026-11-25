/**
 * Batch-load profile display names keyed by auth user_id.
 * Shared by admin list repositories (orders, carts, reviews, views, Q&A).
 */
export async function fetchProfileNameMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { from: (table: string) => any },
  userIds: Array<string | null | undefined>,
  fallback = "Unknown",
): Promise<Map<string, string>> {
  const uniqueIds = [
    ...new Set(userIds.filter((id): id is string => Boolean(id))),
  ];
  const profileMap = new Map<string, string>();
  if (uniqueIds.length === 0) return profileMap;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .in("user_id", uniqueIds);

  for (const p of (profiles ?? []) as Array<{
    user_id: string;
    full_name: string | null;
  }>) {
    profileMap.set(p.user_id, p.full_name || fallback);
  }

  return profileMap;
}
