import { describe, expect, it } from "vitest";
import { createLeadSchema } from "@/lib/validators/lead/create";
import { updateLeadSchema } from "@/lib/validators/lead/update";

describe("createLeadSchema", () => {
  it("accepts a valid email", () => {
    const result = createLeadSchema.safeParse({ email: "lead@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("lead@example.com");
    }
  });

  it("trims and lowercases email", () => {
    const result = createLeadSchema.safeParse({ email: "  Foo@X.com  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("foo@x.com");
    }
  });

  it("rejects invalid email", () => {
    expect(createLeadSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("updateLeadSchema", () => {
  it("trims and lowercases email", () => {
    const result = updateLeadSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "  Bar@Y.COM ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("bar@y.com");
    }
  });
});
