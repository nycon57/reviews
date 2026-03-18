"use client";

import { ButtonGroupPropsSchema } from "../../blocks/schemas/button-group-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { BooleanInput } from "../inputs/boolean-input";
import { KeyValueArrayInput } from "../inputs/key-value-array-input";

type ButtonGroupProps = {
  style?: Record<string, unknown> | null;
  props?: {
    buttons?: { text: string; href: string; variant?: string }[] | null;
    align?: "left" | "center" | "right" | null;
    stackOnMobile?: boolean | null;
  } | null;
};

interface ButtonGroupSidebarPanelProps {
  data: ButtonGroupProps;
  onUpdate: (data: ButtonGroupProps) => void;
}

export function ButtonGroupSidebarPanel({
  data,
  onUpdate,
}: ButtonGroupSidebarPanelProps) {
  function updateData(next: Partial<ButtonGroupProps>) {
    const merged = { ...data, ...next };
    const parsed = ButtonGroupPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const items = (data.props?.buttons ?? []).map((btn) => ({
    key: btn.text,
    value: btn.href,
  }));

  return (
    <BaseSidebarPanel title="Button Group">
      <KeyValueArrayInput
        label="Buttons"
        items={items}
        onChange={(kvItems) => {
          const existing = data.props?.buttons ?? [];
          updateData({
            props: {
              ...data.props,
              buttons: kvItems.map((kv, i) => ({
                ...(existing[i] ?? {}),
                text: kv.key,
                href: kv.value,
              })),
            },
          });
        }}
        keyLabel="Text"
        valueLabel="URL"
        maxItems={5}
      />
      <RadioGroupInput
        label="Alignment"
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
      <BooleanInput
        label="Stack on mobile"
        value={data.props?.stackOnMobile}
        onChange={(stackOnMobile) =>
          updateData({ props: { ...data.props, stackOnMobile } })
        }
      />
    </BaseSidebarPanel>
  );
}
