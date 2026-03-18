"use client";

import { HeaderPropsSchema } from "../../blocks/schemas/header-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { SliderInput } from "../inputs/slider-input";
import { NullableColorInput } from "../inputs/color-input";
import { KeyValueArrayInput } from "../inputs/key-value-array-input";

type NavLink = { label: string; href: string };
type SocialLinks = {
  twitter?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
};

type HeaderProps = {
  style?: Record<string, unknown> | null;
  props?: {
    variant?: "centered" | "inline" | "social" | null;
    logoSrc?: string | null;
    logoAlt?: string | null;
    logoHeight?: number | null;
    navLinks?: NavLink[] | null;
    socialLinks?: SocialLinks | null;
    backgroundColor?: string | null;
    linkColor?: string | null;
  } | null;
};

interface HeaderSidebarPanelProps {
  data: HeaderProps;
  onUpdate: (data: HeaderProps) => void;
}

export function HeaderSidebarPanel({ data, onUpdate }: HeaderSidebarPanelProps) {
  const variant = data.props?.variant ?? "centered";

  function updateData(next: Partial<HeaderProps>) {
    const merged = { ...data, ...next };
    const parsed = HeaderPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Header">
      {/* Variant picker with visual previews */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Layout</p>
        <div className="grid grid-cols-3 gap-2">
          <VariantPreview
            label="Centered"
            active={variant === "centered"}
            onClick={() => updateData({ props: { ...data.props, variant: "centered" } })}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="h-1.5 w-8 rounded-full bg-current opacity-60" />
              <div className="flex gap-1">
                <div className="h-1 w-4 rounded-full bg-current opacity-30" />
                <div className="h-1 w-4 rounded-full bg-current opacity-30" />
                <div className="h-1 w-4 rounded-full bg-current opacity-30" />
              </div>
            </div>
          </VariantPreview>
          <VariantPreview
            label="Inline"
            active={variant === "inline"}
            onClick={() => updateData({ props: { ...data.props, variant: "inline" } })}
          >
            <div className="flex items-center justify-between py-1 px-1">
              <div className="h-1.5 w-6 rounded-full bg-current opacity-60" />
              <div className="flex gap-0.5">
                <div className="h-1 w-3 rounded-full bg-current opacity-30" />
                <div className="h-1 w-3 rounded-full bg-current opacity-30" />
              </div>
            </div>
          </VariantPreview>
          <VariantPreview
            label="Social"
            active={variant === "social"}
            onClick={() => updateData({ props: { ...data.props, variant: "social" } })}
          >
            <div className="flex items-center justify-between py-1 px-1">
              <div className="h-1.5 w-6 rounded-full bg-current opacity-60" />
              <div className="flex gap-0.5">
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
              </div>
            </div>
          </VariantPreview>
        </div>
      </div>

      <ImageUploadInput
        label="Logo"
        value={data.props?.logoSrc}
        onChange={(logoSrc) => updateData({ props: { ...data.props, logoSrc } })}
      />
      <TextInput
        label="Logo alt / fallback text"
        value={data.props?.logoAlt}
        onChange={(logoAlt) => updateData({ props: { ...data.props, logoAlt } })}
        placeholder="Company name"
        showMergeFields
      />
      <SliderInput
        label="Logo height"
        value={data.props?.logoHeight}
        onChange={(logoHeight) => updateData({ props: { ...data.props, logoHeight } })}
        min={20}
        max={120}
        defaultValue={42}
        suffix="px"
      />

      {/* Nav links — shown for centered + inline */}
      {(variant === "centered" || variant === "inline") && (
        <KeyValueArrayInput
          label="Nav links"
          items={(data.props?.navLinks ?? []).map((l) => ({ key: l.label, value: l.href }))}
          onChange={(items) =>
            updateData({
              props: {
                ...data.props,
                navLinks: items.map((i) => ({ label: i.key, href: i.value })),
              },
            })
          }
          keyLabel="Label"
          valueLabel="URL"
          keyPlaceholder="About"
          valuePlaceholder="https://..."
          maxItems={6}
        />
      )}

      {/* Social links — shown for social variant */}
      {variant === "social" && (
        <>
          <TextInput
            label="Twitter / X"
            value={data.props?.socialLinks?.twitter}
            onChange={(twitter) =>
              updateData({
                props: { ...data.props, socialLinks: { ...data.props?.socialLinks, twitter } },
              })
            }
            placeholder="https://x.com/..."
          />
          <TextInput
            label="Instagram"
            value={data.props?.socialLinks?.instagram}
            onChange={(instagram) =>
              updateData({
                props: { ...data.props, socialLinks: { ...data.props?.socialLinks, instagram } },
              })
            }
            placeholder="https://instagram.com/..."
          />
          <TextInput
            label="Facebook"
            value={data.props?.socialLinks?.facebook}
            onChange={(facebook) =>
              updateData({
                props: { ...data.props, socialLinks: { ...data.props?.socialLinks, facebook } },
              })
            }
            placeholder="https://facebook.com/..."
          />
          <TextInput
            label="LinkedIn"
            value={data.props?.socialLinks?.linkedin}
            onChange={(linkedin) =>
              updateData({
                props: { ...data.props, socialLinks: { ...data.props?.socialLinks, linkedin } },
              })
            }
            placeholder="https://linkedin.com/..."
          />
        </>
      )}

      <NullableColorInput
        label="Link color"
        value={data.props?.linkColor}
        onChange={(linkColor) => updateData({ props: { ...data.props, linkColor } })}
        defaultValue="rgb(75,85,99)"
      />
      <NullableColorInput
        label="Background color"
        value={data.props?.backgroundColor}
        onChange={(backgroundColor) => updateData({ props: { ...data.props, backgroundColor } })}
        defaultValue="#ffffff"
      />
    </BaseSidebarPanel>
  );
}

/** Small clickable variant preview card */
function VariantPreview({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-2 text-center transition-colors ${
        active
          ? "border-repwell-teal-300 bg-repwell-teal-300/5 text-repwell-teal-300"
          : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/30"
      }`}
    >
      <div className="mb-1">{children}</div>
      <p className="text-[10px] font-medium leading-none">{label}</p>
    </button>
  );
}
