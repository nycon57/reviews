"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_FAMILIES } from "../../blocks/helpers/font-family";

interface FontFamilyInputProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function FontFamilyInput({
  label,
  value,
  onChange,
}: FontFamilyInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v === "" ? null : v)}
      >
        <SelectTrigger className="text-sm">
          <SelectValue placeholder="Inherit" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
