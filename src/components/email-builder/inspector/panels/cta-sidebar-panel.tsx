"use client";

import { CTAPropsSchema } from "../../blocks/schemas/cta-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type CTAProps = {
  style?: Record<string, unknown> | null;
  props?: {
    heading?: string | null;
    description?: string | null;
    buttonText?: string | null;
    buttonHref?: string | null;
    variant?: "default" | "brand" | "dark" | "gradient" | null;
  } | null;
};

interface CTASidebarPanelProps {
  data: CTAProps;
  onUpdate: (data: CTAProps) => void;
}

export function CTASidebarPanel({ data, onUpdate }: CTASidebarPanelProps) {
  function updateData(next: Partial<CTAProps>) {
    const merged = { ...data, ...next };
    const parsed = CTAPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Call to Action">
      <TextInput
        label="Heading"
        value={data.props?.heading}
        onChange={(heading) =>
          updateData({ props: { ...data.props, heading } })
        }
      />
      <TextInput
        label="Description"
        value={data.props?.description}
        onChange={(description) =>
          updateData({ props: { ...data.props, description } })
        }
        multiline
        rows={3}
      />
      <TextInput
        label="Button text"
        value={data.props?.buttonText}
        onChange={(buttonText) =>
          updateData({ props: { ...data.props, buttonText } })
        }
      />
      <TextInput
        label="Button URL"
        value={data.props?.buttonHref}
        onChange={(buttonHref) =>
          updateData({ props: { ...data.props, buttonHref } })
        }
        placeholder="https://..."
      />
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "default" | "brand" | "dark" | "gradient",
            },
          })
        }
        options={[
          { value: "default", label: "Default" },
          { value: "brand", label: "Brand" },
          { value: "dark", label: "Dark" },
          { value: "gradient", label: "Gradient" },
        ]}
      />
    </BaseSidebarPanel>
  );
}
