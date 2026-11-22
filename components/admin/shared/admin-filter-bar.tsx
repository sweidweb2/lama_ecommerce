"use client";

import { useEffect, useRef, useState, useEffectEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminFilterField =
  | {
      type: "text";
      key: string;
      label: string;
      placeholder?: string;
      className?: string;
    }
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      allValue?: string;
      className?: string;
    }
  | {
      type: "date";
      key: string;
      label: string;
      className?: string;
    };

type AdminFilterBarProps = {
  fields: AdminFilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** controlled = parent state; url = debounce into query string */
  sync?: "controlled" | "url";
  debounceMs?: number;
  preserveParams?: string[];
  onClear?: () => void;
  clearLabel?: string;
  className?: string;
};

/**
 * Shared admin filter row for text / select / date fields.
 */
export function AdminFilterBar({
  fields,
  values,
  onChange,
  sync = "controlled",
  debounceMs = 300,
  preserveParams = [],
  onClear,
  clearLabel = "Clear filters",
  className,
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState(values);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pushUrl = useEffectEvent((next: Record<string, string>) => {
    if (sync !== "url") return;
    const params = new URLSearchParams();
    // Keep non-filter query keys (e.g. contact detail `id`) from the live URL
    if (typeof window !== "undefined" && preserveParams.length > 0) {
      const current = new URLSearchParams(window.location.search);
      for (const key of preserveParams) {
        const existing = next[key] || current.get(key);
        if (existing) params.set(key, existing);
      }
    } else {
      for (const key of preserveParams) {
        if (next[key]) params.set(key, next[key]);
      }
    }
    for (const field of fields) {
      const value = next[field.key]?.trim();
      if (value) params.set(field.key, value);
    }
    // Filter changes reset pagination
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  });

  const handleChange = (key: string, value: string) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    onChange(key, value);

    if (sync !== "url") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushUrl(next), debounceMs);
  };

  const handleClear = () => {
    const cleared: Record<string, string> = {};
    for (const field of fields) {
      cleared[field.key] = "";
      onChange(field.key, "");
    }
    setDraft(cleared);
    onClear?.();
    if (sync === "url") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      pushUrl(cleared);
    }
  };

  return (
    <div
      className={
        className ??
        "flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3"
      }
    >
      {fields.map((field) => {
        if (field.type === "text") {
          return (
            <div key={field.key} className={field.className ?? "min-w-[180px] flex-1"}>
              <Label htmlFor={`filter-${field.key}`} className="mb-1.5 block text-xs">
                {field.label}
              </Label>
              <Input
                id={`filter-${field.key}`}
                value={draft[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        }

        if (field.type === "date") {
          return (
            <div key={field.key} className={field.className ?? "w-[160px]"}>
              <Label htmlFor={`filter-${field.key}`} className="mb-1.5 block text-xs">
                {field.label}
              </Label>
              <Input
                id={`filter-${field.key}`}
                type="date"
                value={draft[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          );
        }

        const allValue = field.allValue ?? "all";
        const current = draft[field.key] || allValue;
        return (
          <div key={field.key} className={field.className ?? "w-[180px]"}>
            <Label className="mb-1.5 block text-xs">{field.label}</Label>
            <Select
              value={current}
              onValueChange={(value) =>
                handleChange(field.key, value === allValue ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={allValue}>All</SelectItem>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {onClear && (
        <Button type="button" variant="outline" onClick={handleClear}>
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
