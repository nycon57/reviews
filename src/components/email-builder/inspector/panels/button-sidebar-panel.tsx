"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ColorInput } from "../inputs/color-input";
import { SliderInput } from "../inputs/slider-input";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { BooleanInput } from "../inputs/boolean-input";

type ButtonProps = {
  props?: {
    text?: string | null;
    href?: string | null;
    fullWidth?: boolean | null;
    borderRadius?: number | null;
    padding?: number | null;
    backgroundColor?: string | null;
    textColor?: string | null;
    borderColor?: string | null;
    fontWeight?: number | null;
    align?: "left" | "center" | "right" | null;
  } | null;
};

interface ButtonSidebarPanelProps {
  data: ButtonProps;
  onUpdate: (data: ButtonProps) => void;
}

export function ButtonSidebarPanel({
  data,
  onUpdate,
}: ButtonSidebarPanelProps) {
  function updateData(next: Partial<ButtonProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Button">
      <TextInput
        label="Text"
        value={data.props?.text}
        onChange={(text) =>
          updateData({ props: { ...data.props, text } })
        }
      />
      <TextInput
        label="URL"
        value={data.props?.href}
        onChange={(href) =>
          updateData({ props: { ...data.props, href } })
        }
        placeholder="https://..."
      />
      <ColorInput
        label="Background color"
        value={data.props?.backgroundColor}
        onChange={(backgroundColor) =>
          updateData({ props: { ...data.props, backgroundColor } })
        }
      />
      <ColorInput
        label="Text color"
        value={data.props?.textColor}
        onChange={(textColor) =>
          updateData({ props: { ...data.props, textColor } })
        }
      />
      <ColorInput
        label="Border color"
        value={data.props?.borderColor}
        onChange={(borderColor) =>
          updateData({ props: { ...data.props, borderColor } })
        }
      />
      <BooleanInput
        label="Full width"
        value={data.props?.fullWidth}
        onChange={(fullWidth) =>
          updateData({ props: { ...data.props, fullWidth } })
        }
      />
      <SliderInput
        label="Border radius"
        value={data.props?.borderRadius}
        onChange={(borderRadius) =>
          updateData({ props: { ...data.props, borderRadius } })
        }
        min={0}
        max={16}
        step={1}
        suffix="px"
        defaultValue={4}
      />
      <SliderInput
        label="Padding"
        value={data.props?.padding}
        onChange={(padding) =>
          updateData({ props: { ...data.props, padding } })
        }
        min={8}
        max={20}
        step={1}
        suffix="px"
        defaultValue={12}
      />
      <RadioGroupInput
        label="Align"
        value={data.props?.align}
        onChange={(align) =>
          updateData({
            props: {
              ...data.props,
              align: align as "left" | "center" | "right",
            },
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
