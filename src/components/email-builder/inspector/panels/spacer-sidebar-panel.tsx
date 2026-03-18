"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { SliderInput } from "../inputs/slider-input";

type SpacerProps = {
  props?: {
    height?: number | null;
  } | null;
};

interface SpacerSidebarPanelProps {
  data: SpacerProps;
  onUpdate: (data: SpacerProps) => void;
}

export function SpacerSidebarPanel({
  data,
  onUpdate,
}: SpacerSidebarPanelProps) {
  function updateData(next: Partial<SpacerProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Spacer">
      <SliderInput
        label="Height"
        value={data.props?.height}
        onChange={(height) =>
          updateData({ props: { ...data.props, height } })
        }
        min={8}
        max={120}
        step={4}
        suffix="px"
        defaultValue={24}
      />
    </BaseSidebarPanel>
  );
}
