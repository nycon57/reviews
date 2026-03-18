"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ColorInput } from "../inputs/color-input";
import { SliderInput } from "../inputs/slider-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type DividerProps = {
  props?: {
    variant?: "solid" | "dashed" | "dotted" | "gradient" | null;
    color?: string | null;
    thickness?: number | null;
    spacing?: "sm" | "md" | "lg" | null;
    label?: string | null;
  } | null;
};

interface DividerSidebarPanelProps {
  data: DividerProps;
  onUpdate: (data: DividerProps) => void;
}

export function DividerSidebarPanel({
  data,
  onUpdate,
}: DividerSidebarPanelProps) {
  function updateData(next: Partial<DividerProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Divider">
      <RadioGroupInput
        label="Style"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as
                | "solid"
                | "dashed"
                | "dotted"
                | "gradient",
            },
          })
        }
        options={[
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
          { value: "gradient", label: "Gradient" },
        ]}
      />
      <ColorInput
        label="Color"
        value={data.props?.color}
        onChange={(color) =>
          updateData({ props: { ...data.props, color } })
        }
      />
      <SliderInput
        label="Thickness"
        value={data.props?.thickness}
        onChange={(thickness) =>
          updateData({ props: { ...data.props, thickness } })
        }
        min={1}
        max={4}
        step={1}
        suffix="px"
        defaultValue={1}
      />
      <RadioGroupInput
        label="Spacing"
        value={data.props?.spacing}
        onChange={(spacing) =>
          updateData({
            props: {
              ...data.props,
              spacing: spacing as "sm" | "md" | "lg",
            },
          })
        }
        options={[
          { value: "sm", label: "Small" },
          { value: "md", label: "Medium" },
          { value: "lg", label: "Large" },
        ]}
      />
      <TextInput
        label="Label"
        value={data.props?.label}
        onChange={(label) =>
          updateData({ props: { ...data.props, label } })
        }
        placeholder="Optional text label"
      />
    </BaseSidebarPanel>
  );
}
