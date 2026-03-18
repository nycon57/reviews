"use client";

import { BaseSidebarPanel } from "./base-sidebar-panel";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { TextInput } from "../inputs/text-input";
import { SliderInput } from "../inputs/slider-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type AvatarProps = {
  props?: {
    variant?: "single" | "stacked" | "profile" | null;
    images?: { src: string; alt: string }[] | null;
    size?: number | null;
    shape?: "circle" | "rounded" | null;
    name?: string | null;
    title?: string | null;
  } | null;
};

interface AvatarSidebarPanelProps {
  data: AvatarProps;
  onUpdate: (data: AvatarProps) => void;
}

export function AvatarSidebarPanel({
  data,
  onUpdate,
}: AvatarSidebarPanelProps) {
  function updateData(next: Partial<AvatarProps>) {
    onUpdate({ ...data, ...next });
  }

  function updateImage(index: number, field: "src" | "alt", value: string) {
    const images = [...(data.props?.images ?? [])];
    images[index] = {
      src: images[index]?.src ?? "",
      alt: images[index]?.alt ?? "",
      [field]: value,
    };
    updateData({ props: { ...data.props, images } });
  }

  const variant = data.props?.variant ?? "single";
  const images = data.props?.images ?? [];

  return (
    <BaseSidebarPanel title="Avatar">
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(v) =>
          updateData({
            props: {
              ...data.props,
              variant: v as "single" | "stacked" | "profile",
            },
          })
        }
        options={[
          { value: "single", label: "Single" },
          { value: "stacked", label: "Stacked" },
          { value: "profile", label: "Profile" },
        ]}
      />

      <ImageUploadInput
        label="Avatar image"
        value={data.props?.images?.[0]?.src}
        onChange={(src) => {
          const imgs = [...(data.props?.images ?? [])];
          imgs[0] = { src: src ?? "", alt: imgs[0]?.alt ?? "" };
          updateData({ props: { ...data.props, images: imgs } });
        }}
      />
      <TextInput
        label="Alt text"
        value={data.props?.images?.[0]?.alt}
        onChange={(alt) => updateImage(0, "alt", alt ?? "")}
      />

      <SliderInput
        label="Size"
        value={data.props?.size}
        onChange={(size) =>
          updateData({ props: { ...data.props, size } })
        }
        min={30}
        max={80}
        step={2}
        suffix="px"
        defaultValue={44}
      />

      <RadioGroupInput
        label="Shape"
        value={data.props?.shape}
        onChange={(shape) =>
          updateData({
            props: {
              ...data.props,
              shape: shape as "circle" | "rounded",
            },
          })
        }
        options={[
          { value: "circle", label: "Circle" },
          { value: "rounded", label: "Rounded" },
        ]}
      />

      {variant === "profile" && (
        <>
          <TextInput
            label="Name"
            value={data.props?.name}
            onChange={(name) =>
              updateData({ props: { ...data.props, name } })
            }
            placeholder="Person's name"
          />
          <TextInput
            label="Title"
            value={data.props?.title}
            onChange={(title) =>
              updateData({ props: { ...data.props, title } })
            }
            placeholder="Job title"
          />
        </>
      )}

      {variant === "stacked" && (
        <>
          <ImageUploadInput
            label="Avatar 2"
            value={images[1]?.src}
            onChange={(src) => updateImage(1, "src", src ?? "")}
          />
          {images[1]?.src && (
            <>
              <TextInput
                label="Avatar 2 alt text"
                value={images[1]?.alt}
                onChange={(alt) => updateImage(1, "alt", alt ?? "")}
              />
              <ImageUploadInput
                label="Avatar 3"
                value={images[2]?.src}
                onChange={(src) => updateImage(2, "src", src ?? "")}
              />
            </>
          )}
          {images[2]?.src && (
            <>
              <TextInput
                label="Avatar 3 alt text"
                value={images[2]?.alt}
                onChange={(alt) => updateImage(2, "alt", alt ?? "")}
              />
              <ImageUploadInput
                label="Avatar 4"
                value={images[3]?.src}
                onChange={(src) => updateImage(3, "src", src ?? "")}
              />
            </>
          )}
          {images[3]?.src && (
            <>
              <TextInput
                label="Avatar 4 alt text"
                value={images[3]?.alt}
                onChange={(alt) => updateImage(3, "alt", alt ?? "")}
              />
              <ImageUploadInput
                label="Avatar 5"
                value={images[4]?.src}
                onChange={(src) => updateImage(4, "src", src ?? "")}
              />
            </>
          )}
          {images[4]?.src && (
            <TextInput
              label="Avatar 5 alt text"
              value={images[4]?.alt}
              onChange={(alt) => updateImage(4, "alt", alt ?? "")}
            />
          )}
        </>
      )}
    </BaseSidebarPanel>
  );
}
