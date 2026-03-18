"use client";

import { SingleStylePropertyPanel } from "./single-style-property-panel";

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

interface MultiStylePropertyPanelProps {
  names: StylePropertyName[];
  value: Record<string, unknown> | null | undefined;
  onChange: (value: Record<string, unknown>) => void;
}

export function MultiStylePropertyPanel({
  names,
  value,
  onChange,
}: MultiStylePropertyPanelProps) {
  const current = value ?? {};

  return (
    <>
      {names.map((name) => (
        <SingleStylePropertyPanel
          key={name}
          name={name}
          value={current[name]}
          onChange={(v) => onChange({ ...current, [name]: v })}
        />
      ))}
    </>
  );
}
