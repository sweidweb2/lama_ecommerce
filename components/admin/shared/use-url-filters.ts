"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UseUrlFiltersOptions = {
  /** Query-string keys that make up the filter state. */
  keys: readonly string[];
  /** Non-filter query keys carried over from the live URL (e.g. detail `id`). */
  preserveParams?: readonly string[];
  /** Delay before typed changes are pushed to the URL. */
  debounceMs?: number;
  /**
   * Override URL writes (e.g. soft-nav with transition).
   * Defaults to `router.replace` with `scroll: false`.
   */
  navigate?: (href: string) => void;
};

export type UseUrlFiltersResult = {
  values: Record<string, string>;
  setValue: (key: string, value: string) => void;
  setValues: (patch: Record<string, string>) => void;
  clear: () => void;
};

function readValues(
  params: Pick<URLSearchParams, "get">,
  keys: readonly string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) result[key] = params.get(key) ?? "";
  return result;
}

function signature(values: Record<string, string>, keys: readonly string[]) {
  return JSON.stringify(keys.map((key) => values[key] ?? ""));
}

/**
 * Filter state mirrored to the URL query string.
 * Local `values` update instantly (controlled inputs); URL writes are debounced
 * and reset pagination. External URL changes (back/forward, links) win.
 */
export function useUrlFilters({
  keys,
  preserveParams = [],
  debounceMs = 300,
  navigate,
}: UseUrlFiltersOptions): UseUrlFiltersResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keysSignature = keys.join("\u0000");
  const urlValues = useMemo(
    () => readValues(searchParams, keys),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keys tracked by signature
    [searchParams, keysSignature],
  );
  const urlSignature = signature(urlValues, keys);

  const [values, setLocalValues] = useState(urlValues);
  const [seenUrlSignature, setSeenUrlSignature] = useState(urlSignature);
  const [pushedSignature, setPushedSignature] = useState<string | null>(null);

  const pushCtxRef = useRef({
    keys,
    preserveParams,
    pathname,
    searchParams,
    navigate,
    router,
    setPushedSignature,
  });
  pushCtxRef.current = {
    keys,
    preserveParams,
    pathname,
    searchParams,
    navigate,
    router,
    setPushedSignature,
  };

  // Adopt URL changes we did not cause ourselves (derived state, no effect).
  if (urlSignature !== seenUrlSignature) {
    setSeenUrlSignature(urlSignature);
    if (urlSignature !== pushedSignature) setLocalValues(urlValues);
  }

  const pushUrl = (next: Record<string, string>) => {
    const ctx = pushCtxRef.current;
    const params = new URLSearchParams();
    for (const key of ctx.preserveParams) {
      const existing = ctx.searchParams.get(key);
      if (existing) params.set(key, existing);
    }
    for (const key of ctx.keys) {
      const value = next[key]?.trim();
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    const href = qs ? `${ctx.pathname}?${qs}` : ctx.pathname;
    ctx.setPushedSignature(signature(readValues(params, ctx.keys), ctx.keys));
    if (ctx.navigate) ctx.navigate(href);
    else ctx.router.replace(href, { scroll: false });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const setValues = (patch: Record<string, string>) => {
    const next = { ...values, ...patch };
    setLocalValues(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushUrl(next), debounceMs);
  };

  const setValue = (key: string, value: string) => setValues({ [key]: value });

  const clear = () => {
    const cleared = readValues({ get: () => null }, keys);
    setLocalValues(cleared);
    if (timerRef.current) clearTimeout(timerRef.current);
    pushUrl(cleared);
  };

  return { values, setValue, setValues, clear };
}
