"use client";

import {
  AdminFilterBar,
  type AdminFilterField,
} from "@/components/admin/shared/admin-filter-bar";
import { useUrlFilters } from "@/components/admin/shared/use-url-filters";

const FILTER_KEYS = ["name", "email", "from", "to"] as const;
const PRESERVE_PARAMS = ["id"] as const;

const FIELDS: AdminFilterField[] = [
  {
    type: "text",
    key: "name",
    label: "Name",
    placeholder: "Search name",
    className: "space-y-1",
  },
  {
    type: "text",
    key: "email",
    label: "Email",
    placeholder: "Search email",
    className: "space-y-1",
  },
  {
    type: "date",
    key: "from",
    label: "From date",
    className: "space-y-1",
  },
  {
    type: "date",
    key: "to",
    label: "To date",
    className: "space-y-1",
  },
];

export function ContactFilters() {
  const { values, setValue, clear } = useUrlFilters({
    keys: FILTER_KEYS,
    preserveParams: PRESERVE_PARAMS,
  });

  const hasActiveFilters = FILTER_KEYS.some(
    (key) => (values[key] ?? "").trim() !== "",
  );

  return (
    <AdminFilterBar
      fields={FIELDS}
      values={values}
      onChange={setValue}
      onClear={clear}
      showClear={hasActiveFilters}
      className="grid gap-4 md:grid-cols-4 items-end"
    />
  );
}
