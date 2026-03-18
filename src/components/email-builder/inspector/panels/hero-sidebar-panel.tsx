"use client";

import { HeroPropsSchema } from "../../blocks/schemas/hero-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { NullableColorInput } from "../inputs/color-input";

type HeroProps = {
  style?: Record<string, unknown> | null;
  props?: {
    headline?: string | null;
    description?: string | null;
    buttonText?: string | null;
    buttonHref?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    imagePosition?: "top" | "bottom" | "right" | null;
    contentBackgroundColor?: string | null;
  } | null;
};

interface HeroSidebarPanelProps {
  data: HeroProps;
  onUpdate: (data: HeroProps) => void;
}

export function HeroSidebarPanel({ data, onUpdate }: HeroSidebarPanelProps) {
  function updateData(next: Partial<HeroProps>) {
    const merged = { ...data, ...next };
    const parsed = HeroPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Hero">
      <TextInput
        label="Headline"
        value={data.props?.headline}
        onChange={(headline) =>
          updateData({ props: { ...data.props, headline } })
        }
        placeholder="Your headline here"
      />
      <TextInput
        label="Description"
        value={data.props?.description}
        onChange={(description) =>
          updateData({ props: { ...data.props, description } })
        }
        multiline
        rows={3}
        placeholder="Supporting text..."
      />
      <TextInput
        label="Button text"
        value={data.props?.buttonText}
        onChange={(buttonText) =>
          updateData({ props: { ...data.props, buttonText } })
        }
        placeholder="Get Started"
      />
      <TextInput
        label="Button URL"
        value={data.props?.buttonHref}
        onChange={(buttonHref) =>
          updateData({ props: { ...data.props, buttonHref } })
        }
        placeholder="https://..."
      />
      <ImageUploadInput
        label="Image"
        value={data.props?.imageUrl}
        onChange={(imageUrl) =>
          updateData({ props: { ...data.props, imageUrl } })
        }
      />
      <TextInput
        label="Image alt text"
        value={data.props?.imageAlt}
        onChange={(imageAlt) =>
          updateData({ props: { ...data.props, imageAlt } })
        }
        placeholder="Hero image"
      />
      <RadioGroupInput
        label="Image position"
        value={data.props?.imagePosition}
        onChange={(imagePosition) =>
          updateData({
            props: {
              ...data.props,
              imagePosition: imagePosition as "top" | "bottom" | "right",
            },
          })
        }
        options={[
          { value: "top", label: "Top" },
          { value: "bottom", label: "Bottom" },
          { value: "right", label: "Right" },
        ]}
      />
      <NullableColorInput
        label="Content background"
        value={data.props?.contentBackgroundColor}
        onChange={(contentBackgroundColor) =>
          updateData({ props: { ...data.props, contentBackgroundColor } })
        }
        defaultValue="#f8f8f8"
      />
    </BaseSidebarPanel>
  );
}
