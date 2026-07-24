import type { UserAddress } from "@/types/user";
import {
  getAddressesByUserId as repoGetByUserId,
  findAddressByFields as repoFindByFields,
  createAddress as repoCreate,
  updateAddressById as repoUpdate,
  deleteAddressById as repoDelete,
  setDefaultAddress as repoSetDefault,
  type CreateAddressPayload,
  type UpdateAddressPayload,
} from "@/repositories/address.repository";
import { createAddressSchema } from "@/lib/validators/user_address/create";
import { updateAddressSchema } from "@/lib/validators/user_address/update";

/**
 * Get all addresses for a user. Call from Server Component with current user id.
 */
export async function getAddressesByUserId(
  userId: string,
): Promise<UserAddress[]> {
  return repoGetByUserId(userId);
}

export type CreateAddressResult =
  | { ok: true; data: UserAddress }
  | { ok: false; error: string };

/**
 * Create an address for the given user. Validate with Zod.
 * Skips insert when an identical row already exists; may promote to default.
 * Call from server action after verifying user.
 */
export async function createAddressForUser(
  userId: string,
  payload: Omit<CreateAddressPayload, "user_id">,
): Promise<CreateAddressResult> {
  const parsed = createAddressSchema.safeParse({ ...payload, user_id: userId });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = Object.values(first).flat().find(Boolean) ?? "Invalid address data";
    return { ok: false, error: String(msg) };
  }

  const data = parsed.data;
  const existing = await repoFindByFields(userId, {
    country: data.country,
    city: data.city,
    address: data.address,
    postal_code: data.postal_code ?? null,
    phone: data.phone,
  });

  if (existing) {
    if (data.is_default === true && !existing.is_default) {
      const promoted = await repoSetDefault(existing.id, userId);
      if (!promoted) {
        return { ok: false, error: "Failed to set default address" };
      }
      return { ok: true, data: promoted };
    }
    return { ok: true, data: existing };
  }

  const created = await repoCreate({ ...data, user_id: userId });
  if (!created) return { ok: false, error: "Failed to save address" };
  return { ok: true, data: created };
}

/**
 * Update an address. Only the owner can update. Validate with Zod.
 */
export async function updateAddressForUser(
  userId: string,
  addressId: string,
  updates: UpdateAddressPayload,
): Promise<UserAddress | null> {
  const parsed = updateAddressSchema.safeParse(updates);
  if (!parsed.success) return null;
  return repoUpdate(addressId, userId, parsed.data);
}

/**
 * Hard-delete an address. Only the owner can delete.
 */
export async function deleteAddressForUser(
  userId: string,
  addressId: string,
): Promise<boolean> {
  return repoDelete(addressId, userId);
}

/**
 * Set an address as the default. Only the owner.
 */
export async function setDefaultAddressForUser(
  userId: string,
  addressId: string,
): Promise<UserAddress | null> {
  return repoSetDefault(addressId, userId);
}
