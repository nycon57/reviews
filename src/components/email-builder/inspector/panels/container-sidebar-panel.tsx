"use client";

import { ContainerPropsSchema } from "@usewaypoint/block-container";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { SliderInput } from "../inputs/slider-input";
import { MultiStylePropertyPanel } from "../inputs/multi-style-property-panel";

type ContainerStyleProps = {
  style?: Record<string, unknown> | null;
};

interface ContainerSidebarPanelProps {
  data: ContainerStyleProps;
  onUpdate: (data: ContainerStyleProps) => void;
}

export function ContainerSidebarPanel({
  data,
  onUpdate,
}: ContainerSidebarPanelProps) {
  function updateData(next: Partial<ContainerStyleProps>) {
    const merged = { ...data, ...next };
    const parsed = ContainerPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const style = (data.style ?? {}) as Record<string, unknown>;

  return (
    <BaseSidebarPanel title="Container">
      <MultiStylePropertyPanel
        names={["backgroundColor", "borderColor", "padding"]}
        value={data.style as Record<string, unknown> | null}
        onChange={(s) => updateData({ style: s })}
      />
      <SliderInput
        label="Border radius"
        value={style.borderRadius as number | null | undefined}
        onChange={(borderRadius) =>
          updateData({ style: { ...style, borderRadius } })
        }
        min={0}
        max={32}
        step={1}
        suffix="px"
        defaultValue={0}
      />
    </BaseSidebarPanel>
  );
}
