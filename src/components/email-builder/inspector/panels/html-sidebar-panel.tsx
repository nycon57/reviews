"use client";

import { HtmlPropsSchema } from "@usewaypoint/block-html";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { MultiStylePropertyPanel } from "../inputs/multi-style-property-panel";

type HtmlProps = {
  style?: Record<string, unknown> | null;
  props?: {
    contents?: string | null;
  } | null;
};

interface HtmlSidebarPanelProps {
  data: HtmlProps;
  onUpdate: (data: HtmlProps) => void;
}

export function HtmlSidebarPanel({ data, onUpdate }: HtmlSidebarPanelProps) {
  function updateData(next: Partial<HtmlProps>) {
    const merged = { ...data, ...next };
    const parsed = HtmlPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    } else if (process.env.NODE_ENV === "development") {
      console.warn("HtmlSidebarPanel: validation failed", parsed.error.format());
    }
  }

  return (
    <BaseSidebarPanel title="HTML">
      <TextInput
        label="HTML content"
        value={data.props?.contents}
        onChange={(contents) =>
          updateData({ props: { ...data.props, contents } })
        }
        multiline
        rows={10}
        placeholder="<p>Your HTML here...</p>"
      />
      <MultiStylePropertyPanel
        names={[
          "color",
          "backgroundColor",
          "fontFamily",
          "fontSize",
          "textAlign",
          "padding",
        ]}
        value={data.style as Record<string, unknown> | null}
        onChange={(style) => updateData({ style })}
      />
    </BaseSidebarPanel>
  );
}
