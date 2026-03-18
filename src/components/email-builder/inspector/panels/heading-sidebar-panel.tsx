"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { NullableColorInput } from "../inputs/color-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type HeadingProps = {
  props?: {
    text?: string | null;
    level?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | null;
    align?: "left" | "center" | "right" | null;
    color?: string | null;
  } | null;
};

interface HeadingSidebarPanelProps {
  data: HeadingProps;
  onUpdate: (data: HeadingProps) => void;
}

export function HeadingSidebarPanel({
  data,
  onUpdate,
}: HeadingSidebarPanelProps) {
  function updateData(next: Partial<HeadingProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Heading">
      <TextInput
        label="Content"
        value={data.props?.text}
        onChange={(text) =>
          updateData({ props: { ...data.props, text } })
        }
      />
      <RadioGroupInput
        label="Level"
        value={data.props?.level}
        onChange={(level) =>
          updateData({
            props: {
              ...data.props,
              level: level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6",
            },
          })
        }
        options={[
          { value: "h1", label: "H1" },
          { value: "h2", label: "H2" },
          { value: "h3", label: "H3" },
          { value: "h4", label: "H4" },
          { value: "h5", label: "H5" },
          { value: "h6", label: "H6" },
        ]}
      />
      <NullableColorInput
        label="Color"
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
    </BaseSidebarPanel>
  );
}
