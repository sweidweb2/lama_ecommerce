import { describe, expect, it } from "vitest";
import { createLeadSchema } from "@/lib/validators/lead/create";

describe("createLeadSchema", () => {
  it("accepts a valid email", () => {
    const result = createLeadSchema.safeParse({ email: "lead@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(createLeadSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ email: "" }).success).toBe(false);
  });
});
