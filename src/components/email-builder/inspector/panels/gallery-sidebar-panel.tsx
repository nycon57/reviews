"use client";

import { GalleryPropsSchema } from "../../blocks/schemas/gallery-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { KeyValueArrayInput } from "../inputs/key-value-array-input";

type GalleryProps = {
  style?: Record<string, unknown> | null;
  props?: {
    variant?: "grid" | "featured" | null;
    heading?: string | null;
    description?: string | null;
    images?: { src: string; alt: string; href: string }[] | null;
  } | null;
};

interface GallerySidebarPanelProps {
  data: GalleryProps;
  onUpdate: (data: GalleryProps) => void;
}

export function GallerySidebarPanel({
  data,
  onUpdate,
}: GallerySidebarPanelProps) {
  function updateData(next: Partial<GalleryProps>) {
    const merged = { ...data, ...next };
    const parsed = GalleryPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const originalImages = data.props?.images ?? [];
  const images = originalImages.map((img) => ({
    key: img.alt,
    value: img.src,
  }));

  return (
    <BaseSidebarPanel title="Gallery">
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "grid" | "featured",
            },
          })
        }
        options={[
          { value: "grid", label: "Grid" },
          { value: "featured", label: "Featured" },
        ]}
      />
      <TextInput
        label="Heading"
        value={data.props?.heading}
        onChange={(heading) =>
          updateData({ props: { ...data.props, heading } })
        }
        placeholder="Elegant Style"
        showMergeFields
      />
      <TextInput
        label="Description"
        value={data.props?.description}
        onChange={(description) =>
          updateData({ props: { ...data.props, description } })
        }
        multiline
        rows={3}
        placeholder="A brief description..."
        showMergeFields
      />
      <KeyValueArrayInput
        label="Images"
        items={images}
        onChange={(kvItems) =>
          updateData({
            props: {
              ...data.props,
              images: kvItems.map((kv, i) => ({
                alt: kv.key,
                src: kv.value,
                href: originalImages[i]?.href ?? kv.value,
              })),
            },
          })
        }
        keyLabel="Alt text"
        valueLabel="Image URL"
        keyPlaceholder="Product image"
        valuePlaceholder="https://..."
        maxItems={4}
      />
    </BaseSidebarPanel>
  );
}
