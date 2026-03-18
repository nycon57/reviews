"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { ColorInput } from "../inputs/color-input";
import { FontFamilyInput } from "../inputs/font-family-input";

type EmailLayoutData = {
  backdropColor?: string | null;
  canvasColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
};

interface EmailLayoutSidebarPanelProps {
  data: EmailLayoutData;
  onUpdate: (data: EmailLayoutData) => void;
}

export function EmailLayoutSidebarPanel({
  data,
  onUpdate,
}: EmailLayoutSidebarPanelProps) {
  return (
    <BaseSidebarPanel title="Email layout">
      <ColorInput
        label="Backdrop color"
        value={data.backdropColor}
        onChange={(backdropColor) => onUpdate({ ...data, backdropColor })}
      />
      <ColorInput
        label="Canvas color"
        value={data.canvasColor}
        onChange={(canvasColor) => onUpdate({ ...data, canvasColor })}
      />
      <ColorInput
        label="Text color"
        value={data.textColor}
        onChange={(textColor) => onUpdate({ ...data, textColor })}
      />
      <FontFamilyInput
        label="Font family"
        value={data.fontFamily}
        onChange={(fontFamily) => onUpdate({ ...data, fontFamily })}
      />
    </BaseSidebarPanel>
  );
}
