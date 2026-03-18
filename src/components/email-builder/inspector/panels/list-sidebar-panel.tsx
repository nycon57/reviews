"use client";

import { ListPropsSchema } from "../../blocks/schemas/list-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { NullableColorInput } from "../inputs/color-input";
import { ArrayItemsInput } from "../inputs/array-items-input";

type ListProps = {
  style?: Record<string, unknown> | null;
  props?: {
    items?: string[] | null;
    type?: "bullet" | "number" | "check" | null;
    markerColor?: string | null;
  } | null;
};

interface ListSidebarPanelProps {
  data: ListProps;
  onUpdate: (data: ListProps) => void;
}

export function ListSidebarPanel({ data, onUpdate }: ListSidebarPanelProps) {
  function updateData(next: Partial<ListProps>) {
    const merged = { ...data, ...next };
    const parsed = ListPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    } else {
      console.warn("[ListSidebarPanel] Validation failed:", parsed.error.format());
    }
  }

  return (
    <BaseSidebarPanel title="List">
      <ArrayItemsInput
        label="Items"
        items={data.props?.items ?? []}
        onChange={(items) =>
          updateData({ props: { ...data.props, items } })
        }
        placeholder="List item"
        maxItems={20}
      />
      <RadioGroupInput
        label="Type"
        value={data.props?.type}
        onChange={(type) =>
          updateData({
            props: {
              ...data.props,
              type: type as "bullet" | "number" | "check",
            },
          })
        }
        options={[
          { value: "bullet", label: "Bullet" },
          { value: "number", label: "Number" },
          { value: "check", label: "Check" },
        ]}
      />
      <NullableColorInput
        label="Marker color"
        value={data.props?.markerColor}
        onChange={(markerColor) =>
          updateData({ props: { ...data.props, markerColor } })
        }
        defaultValue="#333333"
      />
    </BaseSidebarPanel>
  );
}
