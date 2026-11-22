import { describe, expect, it } from "vitest";
import { updateShipmentSchema } from "@/lib/validators/shipment/update";

describe("updateShipmentSchema", () => {
  it("accepts valid carrier and tracking", () => {
    expect(
      updateShipmentSchema.safeParse({
        carrier_name: "Aramex",
        tracking_number: "TRK-123",
      }).success,
    ).toBe(true);
  });

  it("rejects empty fields", () => {
    expect(
      updateShipmentSchema.safeParse({
        carrier_name: "",
        tracking_number: "TRK-123",
      }).success,
    ).toBe(false);
    expect(
      updateShipmentSchema.safeParse({
        carrier_name: "Aramex",
        tracking_number: "",
      }).success,
    ).toBe(false);
  });
});
