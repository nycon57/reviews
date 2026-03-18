"use client";

import { ArticlePropsSchema } from "../../blocks/schemas/article-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type ArticleProps = {
  style?: Record<string, unknown> | null;
  props?: {
    variant?: "hero" | "horizontal" | null;
    heading?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    imageAlt?: string | null;
    buttonText?: string | null;
    buttonHref?: string | null;
  } | null;
};

interface ArticleSidebarPanelProps {
  data: ArticleProps;
  onUpdate: (data: ArticleProps) => void;
}

export function ArticleSidebarPanel({
  data,
  onUpdate,
}: ArticleSidebarPanelProps) {
  function updateData(next: Partial<ArticleProps>) {
    const merged = { ...data, ...next };
    const parsed = ArticlePropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Article">
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "hero" | "horizontal",
            },
          })
        }
        options={[
          { value: "hero", label: "Hero" },
          { value: "horizontal", label: "Horizontal" },
        ]}
      />
      <TextInput
        label="Heading"
        value={data.props?.heading}
        onChange={(heading) =>
          updateData({ props: { ...data.props, heading } })
        }
        placeholder="Article title"
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
        placeholder="Article summary..."
        showMergeFields
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
        placeholder="Article image"
      />
      <TextInput
        label="Button text"
        value={data.props?.buttonText}
        onChange={(buttonText) =>
          updateData({ props: { ...data.props, buttonText } })
        }
        placeholder="Read more"
      />
      <TextInput
        label="Button URL"
        value={data.props?.buttonHref}
        onChange={(buttonHref) =>
          updateData({ props: { ...data.props, buttonHref } })
        }
        placeholder="https://..."
      />
    </BaseSidebarPanel>
  );
}
