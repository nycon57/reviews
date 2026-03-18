"use client";

import { NullableColorInput } from "./color-input";
import { FontFamilyInput } from "./font-family-input";
import { FontSizeInput } from "./font-size-input";
import { FontWeightInput } from "./font-weight-input";
import { TextAlignInput } from "./text-align-input";
import { PaddingInput } from "./padding-input";

type StylePropertyName =
  | "color"
  | "backgroundColor"
  | "fontSize"
  | "fontFamily"
  | "fontWeight"
  | "textAlign"
  | "padding"
  | "borderColor"
  | "borderRadius";

interface SingleStylePropertyPanelProps {
  name: StylePropertyName;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function SingleStylePropertyPanel({
  name,
  value,
  onChange,
}: SingleStylePropertyPanelProps) {
  switch (name) {
    case "color":
      return (
        <NullableColorInput
          label="Text color"
          value={value as string | null | undefined}
          onChange={onChange}
          defaultValue="#000000"
        />
      );

    case "backgroundColor":
      return (
        <NullableColorInput
          label="Background color"
          value={value as string | null | undefined}
          onChange={onChange}
          defaultValue="#ffffff"
        />
      );

    case "borderColor":
      return (
        <NullableColorInput
          label="Border color"
          value={value as string | null | undefined}
          onChange={onChange}
          defaultValue="#cccccc"
        />
      );

    case "fontSize":
      return (
        <FontSizeInput
          label="Font size"
          value={value as number | null | undefined}
          onChange={(v) => onChange(v)}
        />
      );

    case "fontFamily":
      return (
        <FontFamilyInput
          label="Font family"
          value={value as string | null | undefined}
          onChange={onChange}
        />
      );

    case "fontWeight":
      return (
        <FontWeightInput
          label="Font weight"
          value={value as "bold" | "normal" | null | undefined}
          onChange={onChange}
        />
      );

    case "textAlign":
      return (
        <TextAlignInput
          label="Text align"
          value={value as "left" | "center" | "right" | null | undefined}
          onChange={onChange}
        />
      );

    case "padding":
      return (
        <PaddingInput
          label="Padding"
          value={
            value as {
              top: number;
              bottom: number;
              left: number;
              right: number;
            } | null
          }
          onChange={onChange}
        />
      );

    case "borderRadius":
      return (
        <FontSizeInput
          label="Border radius"
          value={value as number | null | undefined}
          onChange={(v) => onChange(v)}
        />
      );

    default:
      return null;
  }
}
