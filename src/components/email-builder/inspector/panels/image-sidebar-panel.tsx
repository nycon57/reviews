"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { TextInput } from "../inputs/text-input";
import { SliderInput } from "../inputs/slider-input";

type ImageProps = {
  props?: {
    src?: string | null;
    alt?: string | null;
    width?: number | null;
    height?: number | null;
    borderRadius?: number | null;
    align?: "left" | "center" | "right" | null;
    href?: string | null;
    caption?: string | null;
  } | null;
};

interface ImageSidebarPanelProps {
  data: ImageProps;
  onUpdate: (data: ImageProps) => void;
}

export function ImageSidebarPanel({
  data,
  onUpdate,
}: ImageSidebarPanelProps) {
  function updateData(next: Partial<ImageProps>) {
    onUpdate({ ...data, ...next });
  }

  return (
    <BaseSidebarPanel title="Image">
      <ImageUploadInput
        label="Image"
        value={data.props?.src}
        onChange={(src) =>
          updateData({ props: { ...data.props, src } })
        }
      />
      <TextInput
        label="Alt text"
        value={data.props?.alt}
        onChange={(alt) =>
          updateData({ props: { ...data.props, alt } })
        }
        placeholder="Describe the image..."
      />
      <TextInput
        label="Link URL"
        value={data.props?.href}
        onChange={(href) =>
          updateData({ props: { ...data.props, href } })
        }
        placeholder="https://..."
      />
      <TextInput
        label="Caption"
        value={data.props?.caption}
        onChange={(caption) =>
          updateData({ props: { ...data.props, caption } })
        }
        placeholder="Optional image caption"
      />
      <SliderInput
        label="Width"
        value={data.props?.width}
        onChange={(width) =>
          updateData({ props: { ...data.props, width } })
        }
        min={50}
        max={600}
        step={10}
        suffix="px"
        defaultValue={600}
      />
      <SliderInput
        label="Border radius"
        value={data.props?.borderRadius}
        onChange={(borderRadius) =>
          updateData({ props: { ...data.props, borderRadius } })
        }
        min={0}
        max={24}
        step={1}
        suffix="px"
        defaultValue={0}
      />
    </BaseSidebarPanel>
  );
}
