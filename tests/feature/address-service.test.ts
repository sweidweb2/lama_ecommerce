import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserAddress } from "@/types/user";

const getAddressesByUserId = vi.fn();
const findAddressByFields = vi.fn();
const createAddress = vi.fn();
const updateAddressById = vi.fn();
const deleteAddressById = vi.fn();
const setDefaultAddress = vi.fn();

vi.mock("@/repositories/address.repository", () => ({
  getAddressesByUserId: (...args: unknown[]) => getAddressesByUserId(...args),
  findAddressByFields: (...args: unknown[]) => findAddressByFields(...args),
  createAddress: (...args: unknown[]) => createAddress(...args),
  updateAddressById: (...args: unknown[]) => updateAddressById(...args),
  deleteAddressById: (...args: unknown[]) => deleteAddressById(...args),
  setDefaultAddress: (...args: unknown[]) => setDefaultAddress(...args),
}));

const sampleAddress: UserAddress = {
  id: "addr-1",
  user_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  country: "United States",
  city: "Austin",
  address: "123 Main St",
  postal_code: "78701",
  phone: "5125551234",
  is_default: true,
  created_at: "2026-01-01T00:00:00.000Z",
};

const validPayload = {
  country: "United States",
  city: "Austin",
  address: "123 Main St",
  postal_code: "78701",
  phone: "5125551234",
  is_default: true,
};

const userId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const addressId = "b1ffcd00-0d1c-5fa9-cc7e-7cc0ce491b22";

describe("address.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("createAddressForUser validates and creates when no match", async () => {
    findAddressByFields.mockResolvedValue(null);
    createAddress.mockResolvedValue(sampleAddress);
    const { createAddressForUser } = await import("@/services/address.service");

    const result = await createAddressForUser(userId, validPayload);

    expect(result).toEqual({ ok: true, data: sampleAddress });
    expect(findAddressByFields).toHaveBeenCalledWith(userId, {
      country: validPayload.country,
      city: validPayload.city,
      address: validPayload.address,
      postal_code: validPayload.postal_code,
      phone: validPayload.phone,
    });
    expect(createAddress).toHaveBeenCalledWith({
      ...validPayload,
      user_id: userId,
    });
  });

  it("createAddressForUser skips insert when identical address exists", async () => {
    const existing = { ...sampleAddress, is_default: false };
    findAddressByFields.mockResolvedValue(existing);
    const { createAddressForUser } = await import("@/services/address.service");

    const result = await createAddressForUser(userId, {
      ...validPayload,
      is_default: false,
    });

    expect(result).toEqual({ ok: true, data: existing });
    expect(createAddress).not.toHaveBeenCalled();
    expect(setDefaultAddress).not.toHaveBeenCalled();
  });

  it("createAddressForUser promotes existing match when is_default", async () => {
    const existing = { ...sampleAddress, is_default: false };
    const promoted = { ...existing, is_default: true };
    findAddressByFields.mockResolvedValue(existing);
    setDefaultAddress.mockResolvedValue(promoted);
    const { createAddressForUser } = await import("@/services/address.service");

    const result = await createAddressForUser(userId, validPayload);

    expect(result).toEqual({ ok: true, data: promoted });
    expect(createAddress).not.toHaveBeenCalled();
    expect(setDefaultAddress).toHaveBeenCalledWith(existing.id, userId);
  });

  it("createAddressForUser rejects invalid phone without calling repo", async () => {
    const { createAddressForUser } = await import("@/services/address.service");

    const result = await createAddressForUser(userId, {
      ...validPayload,
      phone: "12345",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/phone/i);
    }
    expect(findAddressByFields).not.toHaveBeenCalled();
    expect(createAddress).not.toHaveBeenCalled();
  });

  it("updateAddressForUser validates and updates", async () => {
    updateAddressById.mockResolvedValue({
      ...sampleAddress,
      city: "Dallas",
    });
    const { updateAddressForUser } = await import("@/services/address.service");

    const result = await updateAddressForUser(userId, addressId, {
      city: "Dallas",
    });

    expect(result?.city).toBe("Dallas");
    expect(updateAddressById).toHaveBeenCalledWith(addressId, userId, {
      city: "Dallas",
      is_default: false,
    });
  });

  it("updateAddressForUser returns null on invalid payload", async () => {
    const { updateAddressForUser } = await import("@/services/address.service");

    const result = await updateAddressForUser(userId, addressId, {
      phone: "abc",
    });

    expect(result).toBeNull();
    expect(updateAddressById).not.toHaveBeenCalled();
  });

  it("deleteAddressForUser delegates to repo", async () => {
    deleteAddressById.mockResolvedValue(true);
    const { deleteAddressForUser } = await import("@/services/address.service");

    const result = await deleteAddressForUser(userId, addressId);

    expect(result).toBe(true);
    expect(deleteAddressById).toHaveBeenCalledWith(addressId, userId);
  });

  it("setDefaultAddressForUser delegates to repo clear-then-set contract", async () => {
    setDefaultAddress.mockResolvedValue(sampleAddress);
    const { setDefaultAddressForUser } = await import(
      "@/services/address.service"
    );

    const result = await setDefaultAddressForUser(userId, addressId);

    expect(result).toEqual(sampleAddress);
    expect(setDefaultAddress).toHaveBeenCalledWith(addressId, userId);
    expect(setDefaultAddress).toHaveBeenCalledTimes(1);
  });

  it("getAddressesByUserId delegates to repo", async () => {
    getAddressesByUserId.mockResolvedValue([sampleAddress]);
    const { getAddressesByUserId: getAddresses } = await import(
      "@/services/address.service"
    );

    const result = await getAddresses(userId);

    expect(result).toEqual([sampleAddress]);
    expect(getAddressesByUserId).toHaveBeenCalledWith(userId);
  });
});
