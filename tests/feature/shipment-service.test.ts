import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminProfile } from "../helpers/mocks";

const requireAdmin = vi.fn();
const updateShipment = vi.fn();

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/repositories/shipment.repository", () => ({
  updateShipment: (...args: unknown[]) => updateShipment(...args),
}));

describe("shipment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Unauthorized for non-admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    const { updateShipmentForAdminService } = await import(
      "@/services/shipment.service"
    );
    await expect(
      updateShipmentForAdminService("ship-1", {
        carrier_name: "Aramex",
        tracking_number: "TRK1",
      }),
    ).resolves.toEqual({ success: false, error: "Unauthorized" });
    expect(updateShipment).not.toHaveBeenCalled();
  });

  it("rejects empty shipment id", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    const { updateShipmentForAdminService } = await import(
      "@/services/shipment.service"
    );
    await expect(
      updateShipmentForAdminService("  ", {
        carrier_name: "Aramex",
        tracking_number: "TRK1",
      }),
    ).resolves.toEqual({ success: false, error: "Invalid shipment ID" });
  });

  it("rejects invalid carrier/tracking payload", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    const { updateShipmentForAdminService } = await import(
      "@/services/shipment.service"
    );
    await expect(
      updateShipmentForAdminService("ship-1", {
        carrier_name: "",
        tracking_number: "TRK1",
      }),
    ).resolves.toMatchObject({ success: false });
    expect(updateShipment).not.toHaveBeenCalled();
  });

  it("updates shipment for admin", async () => {
    requireAdmin.mockResolvedValue(adminProfile);
    updateShipment.mockResolvedValue({
      success: true,
      data: { id: "ship-1", carrier_name: "Aramex" },
    });
    const { updateShipmentForAdminService } = await import(
      "@/services/shipment.service"
    );
    await expect(
      updateShipmentForAdminService("ship-1", {
        carrier_name: "Aramex",
        tracking_number: "TRK1",
      }),
    ).resolves.toMatchObject({ success: true });
    expect(updateShipment).toHaveBeenCalledWith("ship-1", {
      carrier_name: "Aramex",
      tracking_number: "TRK1",
    });
  });
});
