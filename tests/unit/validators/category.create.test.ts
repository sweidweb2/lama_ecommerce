import { describe, expect, it } from "vitest";
import { createCategorySchema } from "@/lib/validators/category";

describe("createCategorySchema", () => {
  it("accepts valid category and defaults is_active", () => {
    const result = createCategorySchema.safeParse({
      name: "Shirts",
      slug: "shirts",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
    }
  });

  it("rejects missing slug and invalid slug pattern", () => {
    expect(
      createCategorySchema.safeParse({ name: "Shirts" }).success,
    ).toBe(false);
    expect(
      createCategorySchema.safeParse({
        name: "Shirts",
        slug: "Bad Slug",
      }).success,
    ).toBe(false);
  });
});
