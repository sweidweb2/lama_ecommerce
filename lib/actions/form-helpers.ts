import { z, type ZodError } from "zod";

/**
 * Read a string field from FormData: trimmed, empty/missing -> null.
 */
export function formString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (value === null || value === undefined) return null;
  const trimmed = value.toString().trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Like `formString`, but distinguishes a missing key (undefined) from an
 * empty one (null). Useful for partial updates.
 */
export function formStringIfPresent(
  formData: FormData,
  key: string,
): string | null | undefined {
  return formData.has(key) ? formString(formData, key) : undefined;
}

/**
 * Read a checkbox-style boolean from FormData.
 * "on" / "true" -> true, any other present value -> false,
 * missing key -> `defaultValue` (undefined when not provided).
 */
export function formBool(
  formData: FormData,
  key: string,
  defaultValue?: boolean,
): boolean | undefined {
  const value = formData.get(key);
  if (value === null || value === undefined) return defaultValue;
  return value === "on" || value === "true";
}

/**
 * First field-level validation message from a ZodError, or a generic fallback.
 */
export function firstZodMessage(error: ZodError): string {
  const { fieldErrors, formErrors } = z.flattenError(error);
  for (const messages of Object.values(fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) return first;
  }
  return formErrors[0] ?? "Invalid input";
}
