/**
 * Neutral storefront ownership identity for the data layer.
 * Not auth-specific — services/actions map SessionContext → Owner.
 */
export type StorefrontOwner =
  | { kind: "user"; userId: string }
  | { kind: "guest"; sessionId: string };

export function isUserOwner(
  owner: StorefrontOwner,
): owner is { kind: "user"; userId: string } {
  return owner.kind === "user";
}

export function isGuestOwner(
  owner: StorefrontOwner,
): owner is { kind: "guest"; sessionId: string } {
  return owner.kind === "guest";
}
