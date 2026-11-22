"use client";

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
  /** Renders the clear button when provided (and `showClear` is not false). */
  onClear?: () => void;
  showClear?: boolean;
  clearLabel?: string;
  className?: string;
};

/**
 * Shared admin filter row for text / select / date fields.
 * Purely controlled: state and URL syncing live with the caller (see `useUrlFilters`).
 */
export function AdminFilterBar({
  fields,
  values,
  onChange,
  onClear,
  showClear = true,
  clearLabel = "Clear filters",
  className,
}: AdminFilterBarProps) {
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
                value={values[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.key, e.target.value)}
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
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          );
        }

        const allValue = field.allValue ?? "all";
        const current = values[field.key] || allValue;
        return (
          <div key={field.key} className={field.className ?? "w-[180px]"}>
            <Label className="mb-1.5 block text-xs">{field.label}</Label>
            <Select
              value={current}
              onValueChange={(value) =>
                onChange(field.key, value === allValue ? "" : value)
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

      {onClear && showClear && (
        <Button type="button" variant="outline" onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </div>
  );
}
