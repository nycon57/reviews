"use client";

import { FeatureListPropsSchema } from "../../blocks/schemas/feature-list-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { KeyValueArrayInput } from "../inputs/key-value-array-input";

type FeatureListProps = {
  style?: Record<string, unknown> | null;
  props?: {
    items?: { title: string; description: string; iconUrl?: string }[] | null;
    variant?: "numbered" | "bulleted" | "icon-rows" | "numbered-circles" | null;
    columns?: 1 | 2 | null;
  } | null;
};

interface FeatureListSidebarPanelProps {
  data: FeatureListProps;
  onUpdate: (data: FeatureListProps) => void;
}

export function FeatureListSidebarPanel({
  data,
  onUpdate,
}: FeatureListSidebarPanelProps) {
  function updateData(next: Partial<FeatureListProps>) {
    const merged = { ...data, ...next };
    const parsed = FeatureListPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const originalItems = data.props?.items ?? [];
  const items = originalItems.map((item) => ({
    key: item.title,
    value: item.description,
  }));

  return (
    <BaseSidebarPanel title="Feature List">
      <KeyValueArrayInput
        label="Features"
        items={items}
        onChange={(kvItems) =>
          updateData({
            props: {
              ...data.props,
              items: kvItems.map((kv, i) => ({
                title: kv.key,
                description: kv.value,
                iconUrl: originalItems[i]?.iconUrl,
              })),
            },
          })
        }
        keyLabel="Title"
        valueLabel="Description"
        maxItems={8}
      />
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "numbered" | "bulleted" | "icon-rows" | "numbered-circles",
            },
          })
        }
        options={[
          { value: "numbered", label: "Numbered" },
          { value: "bulleted", label: "Bulleted" },
          { value: "icon-rows", label: "Icon Rows" },
          { value: "numbered-circles", label: "Numbered Circles" },
        ]}
      />
      <RadioGroupInput
        label="Columns"
        value={data.props?.columns?.toString()}
        onChange={(columns) =>
          updateData({
            props: {
              ...data.props,
              columns: Number(columns) as 1 | 2,
            },
          })
        }
        options={[
          { value: "1", label: "1" },
          { value: "2", label: "2" },
        ]}
      />
    </BaseSidebarPanel>
  );
}
