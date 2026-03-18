"use client";

import { FooterPropsSchema } from "../../blocks/schemas/footer-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { NullableColorInput } from "../inputs/color-input";

type SocialLinks = {
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
};

type FooterProps = {
  style?: Record<string, unknown> | null;
  props?: {
    variant?: "centered" | "split" | null;
    logoSrc?: string | null;
    logoAlt?: string | null;
    companyName?: string | null;
    tagline?: string | null;
    address?: string | null;
    contactInfo?: string | null;
    socialLinks?: SocialLinks | null;
    backgroundColor?: string | null;
  } | null;
};

interface FooterSidebarPanelProps {
  data: FooterProps;
  onUpdate: (data: FooterProps) => void;
}

export function FooterSidebarPanel({ data, onUpdate }: FooterSidebarPanelProps) {
  const variant = data.props?.variant ?? "centered";

  function updateData(next: Partial<FooterProps>) {
    const merged = { ...data, ...next };
    const parsed = FooterPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Footer">
      {/* Variant picker with visual previews */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Layout</p>
        <div className="grid grid-cols-2 gap-2">
          <VariantPreview
            label="Centered"
            active={variant === "centered"}
            onClick={() => updateData({ props: { ...data.props, variant: "centered" } })}
          >
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="h-1.5 w-5 rounded-full bg-current opacity-60" />
              <div className="h-1 w-8 rounded-full bg-current opacity-40" />
              <div className="h-1 w-6 rounded-full bg-current opacity-25" />
              <div className="flex gap-0.5 mt-0.5">
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
              </div>
              <div className="h-0.5 w-10 rounded-full bg-current opacity-15" />
            </div>
          </VariantPreview>
          <VariantPreview
            label="Split"
            active={variant === "split"}
            onClick={() => updateData({ props: { ...data.props, variant: "split" } })}
          >
            <div className="flex items-start justify-between py-1 px-1 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="h-1.5 w-5 rounded-full bg-current opacity-60" />
                <div className="h-1 w-7 rounded-full bg-current opacity-40" />
                <div className="h-1 w-5 rounded-full bg-current opacity-25" />
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex gap-0.5">
                  <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                  <div className="h-2 w-2 rounded-sm bg-current opacity-30" />
                </div>
                <div className="h-0.5 w-6 rounded-full bg-current opacity-15" />
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
        label="Logo alt text"
        value={data.props?.logoAlt}
        onChange={(logoAlt) => updateData({ props: { ...data.props, logoAlt } })}
        placeholder="Company logo"
      />
      <TextInput
        label="Company name"
        value={data.props?.companyName}
        onChange={(companyName) => updateData({ props: { ...data.props, companyName } })}
        placeholder="Acme Inc."
        showMergeFields
      />
      <TextInput
        label="Tagline"
        value={data.props?.tagline}
        onChange={(tagline) => updateData({ props: { ...data.props, tagline } })}
        placeholder="Your tagline here"
      />
      <TextInput
        label="Address"
        value={data.props?.address}
        onChange={(address) => updateData({ props: { ...data.props, address } })}
        placeholder="123 Main St, City, ST 12345"
      />
      <TextInput
        label="Contact info"
        value={data.props?.contactInfo}
        onChange={(contactInfo) => updateData({ props: { ...data.props, contactInfo } })}
        placeholder="hello@example.com | (555) 123-4567"
      />

      {/* Social links — always shown since both variants use them */}
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
        label="LinkedIn"
        value={data.props?.socialLinks?.linkedin}
        onChange={(linkedin) =>
          updateData({
            props: { ...data.props, socialLinks: { ...data.props?.socialLinks, linkedin } },
          })
        }
        placeholder="https://linkedin.com/..."
      />

      <NullableColorInput
        label="Background color"
        value={data.props?.backgroundColor}
        onChange={(backgroundColor) => updateData({ props: { ...data.props, backgroundColor } })}
        defaultValue="#f9fafb"
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
