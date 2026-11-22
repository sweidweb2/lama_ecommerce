"use client";

import { useState } from "react";
import {
  AdminFilterBar,
  type AdminFilterField,
} from "@/components/admin/shared/admin-filter-bar";

interface ContactFiltersProps {
  initialName: string;
  initialEmail: string;
  initialFrom: string;
  initialTo: string;
}

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

export function ContactFilters({
  initialName,
  initialEmail,
  initialFrom,
  initialTo,
}: ContactFiltersProps) {
  const [values, setValues] = useState({
    name: initialName,
    email: initialEmail,
    from: initialFrom,
    to: initialTo,
  });

  const [prevInitials, setPrevInitials] = useState({
    initialName,
    initialEmail,
    initialFrom,
    initialTo,
  });

  if (
    initialName !== prevInitials.initialName ||
    initialEmail !== prevInitials.initialEmail ||
    initialFrom !== prevInitials.initialFrom ||
    initialTo !== prevInitials.initialTo
  ) {
    setPrevInitials({ initialName, initialEmail, initialFrom, initialTo });
    setValues({
      name: initialName,
      email: initialEmail,
      from: initialFrom,
      to: initialTo,
    });
  }

  const hasActiveFilters =
    values.name.trim() !== "" ||
    values.email.trim() !== "" ||
    values.from !== "" ||
    values.to !== "";

  return (
    <AdminFilterBar
      fields={FIELDS}
      values={values}
      onChange={(key, value) =>
        setValues((prev) => ({ ...prev, [key]: value }))
      }
      sync="url"
      preserveParams={["id"]}
      onClear={hasActiveFilters ? () => undefined : undefined}
      clearLabel="Clear filters"
      className="grid gap-4 md:grid-cols-4 items-end"
    />
  );
}
