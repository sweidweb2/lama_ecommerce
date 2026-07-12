import NextLink from "next/link";
import type { ComponentProps } from "react";

export type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Drop-in next/link wrapper.
 * suppressHydrationWarning avoids console noise from browser extensions
 * (e.g. Keychainify) that mutate <a> className before React hydrates.
 */
export function Link({ suppressHydrationWarning = true, ...props }: LinkProps) {
  return <NextLink suppressHydrationWarning={suppressHydrationWarning} {...props} />;
}

export default Link;
