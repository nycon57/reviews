"use client";

import { CalloutPropsSchema } from "../../blocks/schemas/callout-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type CalloutProps = {
  style?: Record<string, unknown> | null;
  props?: {
    text?: string | null;
    title?: string | null;
    variant?: "info" | "success" | "warning" | "tip" | "important" | null;
  } | null;
};

interface CalloutSidebarPanelProps {
  data: CalloutProps;
  onUpdate: (data: CalloutProps) => void;
}

export function CalloutSidebarPanel({
  data,
  onUpdate,
}: CalloutSidebarPanelProps) {
  function updateData(next: Partial<CalloutProps>) {
    const merged = { ...data, ...next };
    const parsed = CalloutPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Callout">
      <TextInput
        label="Title"
        value={data.props?.title}
        onChange={(title) =>
          updateData({ props: { ...data.props, title } })
        }
        placeholder="Note"
      />
      <TextInput
        label="Text"
        value={data.props?.text}
        onChange={(text) =>
          updateData({ props: { ...data.props, text } })
        }
        multiline
        rows={3}
      />
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as
                | "info"
                | "success"
                | "warning"
                | "tip"
                | "important",
            },
          })
        }
        options={[
          { value: "info", label: "Info" },
          { value: "success", label: "Success" },
          { value: "warning", label: "Warning" },
          { value: "tip", label: "Tip" },
          { value: "important", label: "Important" },
        ]}
      />
    </BaseSidebarPanel>
  );
}
