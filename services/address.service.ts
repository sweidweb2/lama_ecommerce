import type { UserAddress } from "@/types/user";
import {
  getAddressesByUserId as repoGetByUserId,
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
 * Get all non-deleted addresses for a user. Call from Server Component with current user id.
 */
export async function getAddressesByUserId(
  userId: string,
): Promise<UserAddress[]> {
  return repoGetByUserId(userId);
}

/**
 * Create an address for the given user. Validate with Zod. Call from server action after verifying user.
 */
export async function createAddressForUser(
  userId: string,
  payload: Omit<CreateAddressPayload, "user_id">,
): Promise<UserAddress | null> {
  const parsed = createAddressSchema.safeParse({ ...payload, user_id: userId });
  if (!parsed.success) return null;
  return repoCreate({ ...parsed.data, user_id: userId });
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
 * Soft-delete an address. Only the owner can delete.
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
