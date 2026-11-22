import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { randomUUID } from "node:crypto";

/** True when service-role env is available for E2E seed/cleanup. */
export function e2eDbReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function e2eDb(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase URL or SERVICE_ROLE_KEY for E2E db helper");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}

export async function createSubscribedLead(email: string): Promise<{
  id: string;
  token: string;
}> {
  const supabase = e2eDb();
  const token = randomUUID();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      email,
      status: "subscribed",
      source: "footer",
      unsubscribe_token: token,
    })
    .select("id, unsubscribe_token")
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed lead: ${error?.message ?? "unknown"}`);
  }
  return { id: data.id, token: data.unsubscribe_token };
}

export async function deleteLeadById(id: string): Promise<void> {
  await e2eDb().from("leads").delete().eq("id", id);
}

/** Resolve auth.users id by email (reviews / Q&A use auth user ids). */
export async function getAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const supabase = e2eDb();
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`listUsers failed: ${error.message}`);
    }
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === normalized,
    );
    if (match) return match.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

/**
 * Ensure a non-admin customer exists for E2E (auth + active profile).
 * Returns credentials that can be used with loginViaUi.
 */
export async function ensureE2eCustomer(input?: {
  email?: string;
  password?: string;
}): Promise<{ email: string; password: string; userId: string }> {
  const email = (input?.email ?? "e2e-user@example.com").trim().toLowerCase();
  const password = input?.password ?? "password123";
  const supabase = e2eDb();

  let userId = await getAuthUserIdByEmail(email);
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "E2E User" },
    });
    if (error || !data.user) {
      throw new Error(`createUser failed: ${error?.message ?? "unknown"}`);
    }
    userId = data.user.id;
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`updateUser failed: ${error.message}`);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: "E2E User",
        role: "user",
        is_active: true,
      })
      .eq("id", profile.id);
    if (error) throw new Error(`profile update failed: ${error.message}`);
  } else {
    const { error } = await supabase.from("profiles").insert({
      user_id: userId,
      full_name: "E2E User",
      role: "user",
      is_active: true,
    });
    if (error) throw new Error(`profile insert failed: ${error.message}`);
  }

  return { email, password, userId };
}

export async function getProductBySlug(
  slug: string,
): Promise<{ id: string; slug: string } | null> {
  const { data } = await e2eDb()
    .from("products")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function deleteReviewsForUserProduct(
  userId: string,
  productId: string,
): Promise<void> {
  await e2eDb()
    .from("reviews")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
}

export async function seedApprovedQa(input: {
  productId: string;
  question: string;
  answer: string;
}): Promise<{ questionId: string }> {
  const supabase = e2eDb();
  const { data: question, error } = await supabase
    .from("product_questions")
    .insert({
      product_id: input.productId,
      question: input.question,
      is_approved: true,
    })
    .select("id")
    .single();

  if (error || !question) {
    throw new Error(`Failed to seed Q: ${error?.message ?? "unknown"}`);
  }

  const { error: answerError } = await supabase.from("product_answers").insert({
    product_question_id: question.id,
    answer: input.answer,
  });

  if (answerError) {
    await supabase.from("product_questions").delete().eq("id", question.id);
    throw new Error(`Failed to seed answer: ${answerError.message}`);
  }

  return { questionId: question.id };
}

export async function deleteProductQuestion(questionId: string): Promise<void> {
  await e2eDb().from("product_questions").delete().eq("id", questionId);
}

export async function deleteProductQuestionsContaining(
  productId: string,
  fragment: string,
): Promise<void> {
  const { data } = await e2eDb()
    .from("product_questions")
    .select("id, question")
    .eq("product_id", productId);

  const ids = (data ?? [])
    .filter((row) => row.question.includes(fragment))
    .map((row) => row.id);

  if (ids.length === 0) return;
  await e2eDb().from("product_questions").delete().in("id", ids);
}

/** Minimal pending order for admin order/shipment E2E. */
export async function seedPendingOrder(input?: {
  email?: string;
  sessionId?: string;
}): Promise<{ id: string; email: string; sessionId: string }> {
  const supabase = e2eDb();
  const email = input?.email ?? `e2e-order-${Date.now()}@example.com`;
  const sessionId = input?.sessionId ?? randomUUID();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      payment_status: "pending",
      email,
      phone: "0500000000",
      session_id: sessionId,
      subtotal: 25,
      shipping_fee: 0,
      discount: 0,
      total: 25,
      stock_restored: false,
      address_snapshot: {
        country: "Israel",
        city: "Tel Aviv",
        address: "1 E2E St",
        postal_code: "10000",
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed order: ${error?.message ?? "unknown"}`);
  }
  return { id: data.id, email, sessionId };
}

export async function setOrderStatus(
  orderId: string,
  status: Database["public"]["Enums"]["order_status"],
): Promise<void> {
  const { error } = await e2eDb()
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) {
    throw new Error(`Failed to set order status: ${error.message}`);
  }
}

export async function seedShipment(input: {
  orderId: string;
  carrierName: string;
  trackingNumber: string;
}): Promise<{ id: string }> {
  const { data, error } = await e2eDb()
    .from("shipments")
    .insert({
      order_id: input.orderId,
      carrier_name: input.carrierName,
      tracking_number: input.trackingNumber,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed shipment: ${error?.message ?? "unknown"}`);
  }
  return { id: data.id };
}

export async function deleteOrderById(orderId: string): Promise<void> {
  await e2eDb().from("orders").delete().eq("id", orderId);
}

/** shipping_zones exists in DB but is missing from generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shippingZonesTable(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (e2eDb() as any).from("shipping_zones");
}

/** Ensure at least one shipping zone exists; returns a zone name for UI select. */
export async function ensureShippingZone(): Promise<{
  id: string;
  name: string;
}> {
  const supabase = e2eDb();
  const { data: existing } = await shippingZonesTable()
    .select("id, name")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const name = `E2E Zone ${Date.now()}`;
  const { data, error } = await supabase.rpc("create_shipping_zone_with_fee", {
    p_name: name,
    p_estimated_time: "2-3 days",
    p_fee: 15,
  });

  if (error || !data?.[0]) {
    throw new Error(`Failed to seed shipping zone: ${error?.message ?? "unknown"}`);
  }
  return { id: data[0].id, name: data[0].name };
}

export async function deleteCartBySessionId(sessionId: string): Promise<void> {
  await e2eDb().from("carts").delete().eq("session_id", sessionId);
}

export async function deleteCartById(cartId: string): Promise<void> {
  await e2eDb().from("carts").delete().eq("id", cartId);
}

export async function findCartBySessionId(
  sessionId: string,
): Promise<{ id: string } | null> {
  const { data } = await e2eDb()
    .from("carts")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  return data;
}

export async function getInStockProductName(): Promise<string | null> {
  const product = await getFirstActiveInStockProduct();
  return product?.name ?? null;
}

export async function getFirstActiveInStockProduct(): Promise<{
  id: string;
  name: string;
  slug: string;
} | null> {
  const supabase = e2eDb();
  // Prefer a join so we never return an inactive product name that the
  // admin cart product picker will not list.
  const { data: variant } = await supabase
    .from("customised_products")
    .select("product_id, products!inner(id, name, slug, is_active)")
    .gt("quantity_stock", 0)
    .eq("products.is_active", true)
    .limit(1)
    .maybeSingle();

  if (!variant?.product_id) return null;

  const product = variant.products as unknown as {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  } | null;

  if (!product) return null;
  return { id: product.id, name: product.name, slug: product.slug };
}

export async function getProfileIdByEmail(
  email: string,
): Promise<string | null> {
  const userId = await getAuthUserIdByEmail(email);
  if (!userId) return null;
  const { data } = await e2eDb()
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function deleteAuthUserByEmail(email: string): Promise<void> {
  const userId = await getAuthUserIdByEmail(email);
  if (!userId) return;
  const { error } = await e2eDb().auth.admin.deleteUser(userId);
  if (!error) return;

  const message =
    typeof error.message === "string" && error.message.trim()
      ? error.message
      : JSON.stringify(error);
  // Soft-fail cleanup: missing/already-deleted users and Auth rate limits
  // should not fail an otherwise-passing E2E assertion.
  const soft =
    /not found|already|does not exist|user not found|404/i.test(message) ||
    message === "{}" ||
    message === "null";
  if (soft) return;
  throw new Error(`Failed to delete auth user: ${message}`);
}

export async function deleteOrdersByEmailFragment(
  fragment: string,
): Promise<void> {
  const { data } = await e2eDb()
    .from("orders")
    .select("id, email")
    .ilike("email", `%${fragment}%`);

  const ids = (data ?? []).map((row) => row.id);
  if (ids.length === 0) return;
  await e2eDb().from("orders").delete().in("id", ids);
}

/** Unique ephemeral customer for mutating parallel-safe tests. */
export async function createUniqueE2eCustomer(prefix = "e2e"): Promise<{
  email: string;
  password: string;
  userId: string;
}> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return ensureE2eCustomer({
    email: `${prefix}-${stamp}@example.com`,
    password: "Password1!",
  });
}

export async function seedInactivePromo(code?: string): Promise<{
  id: string;
  code: string;
}> {
  const promoCode = (code ?? `E2EBAD${Date.now()}`).toUpperCase();
  const { data, error } = await e2eDb()
    .from("promo_codes")
    .insert({
      code: promoCode,
      discount_type: "percentage",
      discount_value: 10,
      is_active: false,
    })
    .select("id, code")
    .single();
  if (error || !data) {
    throw new Error(`Failed to seed promo: ${error?.message ?? "unknown"}`);
  }
  return data;
}

export async function deletePromoById(id: string): Promise<void> {
  await e2eDb().from("promo_codes").delete().eq("id", id);
}

export async function attachOrderToUser(
  orderId: string,
  userId: string,
): Promise<void> {
  const { error } = await e2eDb()
    .from("orders")
    .update({ user_id: userId })
    .eq("id", orderId);
  if (error) {
    throw new Error(`Failed to attach order: ${error.message}`);
  }
}

export async function seedPendingReview(input: {
  productId: string;
  userId: string;
  comment: string;
}): Promise<{ id: string }> {
  const { data, error } = await e2eDb()
    .from("reviews")
    .insert({
      product_id: input.productId,
      user_id: input.userId,
      rating: 5,
      comment: input.comment,
      review_status: "pending",
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to seed review: ${error?.message ?? "unknown"}`);
  }
  return data;
}

export async function deleteReviewById(id: string): Promise<void> {
  await e2eDb().from("reviews").delete().eq("id", id);
}

export async function seedPendingQuestion(input: {
  productId: string;
  question: string;
  userId?: string;
}): Promise<{ id: string }> {
  const { data, error } = await e2eDb()
    .from("product_questions")
    .insert({
      product_id: input.productId,
      question: input.question,
      is_approved: false,
      user_id: input.userId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`Failed to seed question: ${error?.message ?? "unknown"}`);
  }
  return data;
}

export async function deleteBrandById(id: string): Promise<void> {
  await e2eDb().from("brands").delete().eq("id", id);
}

export async function deleteCategoryById(id: string): Promise<void> {
  await e2eDb().from("categories").delete().eq("id", id);
}

export async function deleteShippingZoneById(id: string): Promise<void> {
  await shippingZonesTable().delete().eq("id", id);
}

export async function findBrandIdByName(name: string): Promise<string | null> {
  const { data } = await e2eDb()
    .from("brands")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  return data?.id ?? null;
}

export async function findCategoryIdBySlug(
  slug: string,
): Promise<string | null> {
  const { data } = await e2eDb()
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

export async function findPromoIdByCode(code: string): Promise<string | null> {
  const { data } = await e2eDb()
    .from("promo_codes")
    .select("id")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return data?.id ?? null;
}

export async function findShippingZoneIdByName(
  name: string,
): Promise<string | null> {
  const { data } = await shippingZonesTable()
    .select("id")
    .eq("name", name)
    .maybeSingle();
  return data?.id ?? null;
}

export async function findLeadIdByEmail(email: string): Promise<string | null> {
  const { data } = await e2eDb()
    .from("leads")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

