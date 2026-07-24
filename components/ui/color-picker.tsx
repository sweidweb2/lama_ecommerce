"use client";

import { useState } from "react";
import { ChromePicker, type ColorResult } from "react-color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function normalizeHexInput(raw: string): string {
  let value = raw.trim();
  if (value && !value.startsWith("#")) value = `#${value}`;
  return value.toUpperCase();
}

function isPartialOrFullHex(value: string): boolean {
  return value === "" || /^#[0-9A-Fa-f]{0,6}$/.test(value);
}

function isFullHex(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

/**
 * Shadcn-style color picker: swatch trigger + popover ChromePicker + hex input.
 */
export function ColorPicker({
  value,
  onChange,
  disabled,
  className,
  id,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const displayColor = isFullHex(value) ? value : "#FFFFFF";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-9 w-9 shrink-0 p-0"
            aria-label="Pick color"
            title="Pick color"
          >
            <span
              className="size-6 rounded-sm border border-border"
              style={{ backgroundColor: displayColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <ChromePicker
            color={displayColor}
            disableAlpha
            onChange={(updated: ColorResult) => {
              onChange(updated.hex.toUpperCase());
            }}
          />
        </PopoverContent>
      </Popover>

      <Input
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = normalizeHexInput(e.target.value);
          if (isPartialOrFullHex(next)) {
            onChange(next);
          }
        }}
        placeholder="#000000"
        className="font-mono flex-1 min-w-0"
        maxLength={7}
        aria-label="Color hex value"
      />
    </div>
  );
}
