"use client";

import { TestimonialPropsSchema } from "../../blocks/schemas/testimonial-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { ImageUploadInput } from "../inputs/image-upload-input";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { SliderInput } from "../inputs/slider-input";

type TestimonialProps = {
  style?: Record<string, unknown> | null;
  props?: {
    quote?: string | null;
    authorName?: string | null;
    authorTitle?: string | null;
    authorPhotoUrl?: string | null;
    rating?: number | null;
    variant?: "default" | "featured" | "compact" | null;
  } | null;
};

interface TestimonialSidebarPanelProps {
  data: TestimonialProps;
  onUpdate: (data: TestimonialProps) => void;
}

export function TestimonialSidebarPanel({
  data,
  onUpdate,
}: TestimonialSidebarPanelProps) {
  function updateData(next: Partial<TestimonialProps>) {
    const merged = { ...data, ...next };
    const parsed = TestimonialPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Testimonial">
      <TextInput
        label="Quote"
        value={data.props?.quote}
        onChange={(quote) =>
          updateData({ props: { ...data.props, quote } })
        }
        multiline
        rows={3}
      />
      <TextInput
        label="Author name"
        value={data.props?.authorName}
        onChange={(authorName) =>
          updateData({ props: { ...data.props, authorName } })
        }
        placeholder="Jane Doe"
      />
      <TextInput
        label="Author title"
        value={data.props?.authorTitle}
        onChange={(authorTitle) =>
          updateData({ props: { ...data.props, authorTitle } })
        }
        placeholder="CEO, Acme Inc."
      />
      <ImageUploadInput
        label="Author photo"
        value={data.props?.authorPhotoUrl}
        onChange={(authorPhotoUrl) =>
          updateData({ props: { ...data.props, authorPhotoUrl } })
        }
      />
      <SliderInput
        label="Rating"
        value={data.props?.rating}
        onChange={(rating) =>
          updateData({ props: { ...data.props, rating } })
        }
        min={0}
        max={5}
        step={1}
        defaultValue={5}
      />
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "default" | "featured" | "compact",
            },
          })
        }
        options={[
          { value: "default", label: "Default" },
          { value: "featured", label: "Featured" },
          { value: "compact", label: "Compact" },
        ]}
      />
    </BaseSidebarPanel>
  );
}
