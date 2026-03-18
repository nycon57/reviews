"use client";

import { RatingPropsSchema } from "../../blocks/schemas/rating-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { TextInput } from "../inputs/text-input";
import { RadioGroupInput } from "../inputs/radio-group-input";

type RatingProps = {
  style?: Record<string, unknown> | null;
  props?: {
    question?: string | null;
    scale?: 5 | 10 | null;
    surveyUrl?: string | null;
    lowLabel?: string | null;
    highLabel?: string | null;
  } | null;
};

interface RatingSidebarPanelProps {
  data: RatingProps;
  onUpdate: (data: RatingProps) => void;
}

export function RatingSidebarPanel({ data, onUpdate }: RatingSidebarPanelProps) {
  function updateData(next: Partial<RatingProps>) {
    const merged = { ...data, ...next };
    const parsed = RatingPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  return (
    <BaseSidebarPanel title="Rating">
      <TextInput
        label="Question"
        value={data.props?.question}
        onChange={(question) =>
          updateData({ props: { ...data.props, question } })
        }
        placeholder="How would you rate your experience?"
      />
      <RadioGroupInput
        label="Scale"
        value={data.props?.scale?.toString()}
        onChange={(scale) =>
          updateData({
            props: {
              ...data.props,
              scale: Number(scale) as 5 | 10,
            },
          })
        }
        options={[
          { value: "5", label: "1-5" },
          { value: "10", label: "1-10" },
        ]}
      />
      <TextInput
        label="Survey URL"
        value={data.props?.surveyUrl}
        onChange={(surveyUrl) =>
          updateData({ props: { ...data.props, surveyUrl } })
        }
        placeholder="https://..."
      />
      <TextInput
        label="Low label"
        value={data.props?.lowLabel}
        onChange={(lowLabel) =>
          updateData({ props: { ...data.props, lowLabel } })
        }
        placeholder="Not likely"
      />
      <TextInput
        label="High label"
        value={data.props?.highLabel}
        onChange={(highLabel) =>
          updateData({ props: { ...data.props, highLabel } })
        }
        placeholder="Very likely"
      />
    </BaseSidebarPanel>
  );
}
