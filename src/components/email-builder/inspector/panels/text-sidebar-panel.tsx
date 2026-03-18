"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { SliderInput } from "../inputs/slider-input";
import { NullableColorInput } from "../inputs/color-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type TextProps = {
  props?: {
    text?: string | null;
    fontSize?: number | null;
    lineHeight?: string | null;
    color?: string | null;
    fontWeight?: "normal" | "600" | null;
    align?: "left" | "center" | "right" | null;
  } | null;
};

interface TextSidebarPanelProps {
  data: TextProps;
  onUpdate: (data: TextProps) => void;
}

export function TextSidebarPanel({ data, onUpdate }: TextSidebarPanelProps) {
  function updateData(next: Partial<TextProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Text">
      <TextInput
        label="Content"
        value={data.props?.text}
        onChange={(text) =>
          updateData({ props: { ...data.props, text } })
        }
        multiline
        rows={5}
        showMergeFields
      />
      <SliderInput
        label="Font size"
        value={data.props?.fontSize}
        onChange={(fontSize) =>
          updateData({ props: { ...data.props, fontSize } })
        }
        min={12}
        max={48}
        step={1}
        suffix="px"
        defaultValue={16}
      />
      <NullableColorInput
        label="Text color"
        value={data.props?.color}
        onChange={(color) =>
          updateData({ props: { ...data.props, color } })
        }
      />
      <RadioGroupInput
        label="Align"
        value={data.props?.align}
        onChange={(align) =>
          updateData({
            props: { ...data.props, align: align as "left" | "center" | "right" },
          })
        }
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
      />
      <RadioGroupInput
        label="Weight"
        value={data.props?.fontWeight}
        onChange={(fontWeight) =>
          updateData({
            props: { ...data.props, fontWeight: fontWeight as "normal" | "600" },
          })
        }
        options={[
          { value: "normal", label: "Normal" },
          { value: "600", label: "Bold" },
        ]}
      />
    </BaseSidebarPanel>
  );
}
