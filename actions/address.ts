"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAuthUserFromAction } from "@/repositories/auth.repository";
import {
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
  setDefaultAddressForUser,
} from "@/services/address.service";

type Result = { success: true; data?: unknown } | { success: false; error: string };

export async function createAddressAction(payload: {
  country: string;
  city: string;
  address: string;
  postal_code?: string | null;
  phone: string;
  is_default?: boolean;
}): Promise<Result> {
  const user = await getCurrentAuthUserFromAction();
  if (!user) return { success: false, error: "Not authenticated" };
  const created = await createAddressForUser(user.id, payload);
  if (!created) return { success: false, error: "Invalid input or create failed" };
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, data: created };
}

export async function updateAddressAction(
  addressId: string,
  updates: {
    country?: string;
    city?: string;
    address?: string;
    postal_code?: string | null;
    phone?: string;
    is_default?: boolean;
  },
): Promise<Result> {
  const user = await getCurrentAuthUserFromAction();
  if (!user) return { success: false, error: "Not authenticated" };
  const updated = await updateAddressForUser(user.id, addressId, updates);
  if (!updated) return { success: false, error: "Invalid input or update failed" };
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, data: updated };
}

export async function deleteAddressAction(addressId: string): Promise<Result> {
  const user = await getCurrentAuthUserFromAction();
  if (!user) return { success: false, error: "Not authenticated" };
  const ok = await deleteAddressForUser(user.id, addressId);
  if (!ok) return { success: false, error: "Delete failed" };
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true };
}

export async function setDefaultAddressAction(addressId: string): Promise<Result> {
  const user = await getCurrentAuthUserFromAction();
  if (!user) return { success: false, error: "Not authenticated" };
  const updated = await setDefaultAddressForUser(user.id, addressId);
  if (!updated) return { success: false, error: "Set default failed" };
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  return { success: true, data: updated };
}
