import { describe, expect, it } from "vitest";
import { createBrandSchema } from "@/lib/validators/brand";

describe("createBrandSchema", () => {
  it("accepts valid brand", () => {
    expect(
      createBrandSchema.safeParse({ name: "Lama", slug: "lama" }).success,
    ).toBe(true);
  });

  it("rejects empty name and invalid slug", () => {
    expect(createBrandSchema.safeParse({ name: "" }).success).toBe(false);
    expect(
      createBrandSchema.safeParse({ name: "Lama", slug: "Bad Slug" }).success,
    ).toBe(false);
  });
});
