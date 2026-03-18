"use client";

import { StatsPropsSchema } from "../../blocks/schemas/stats-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { BooleanInput } from "../inputs/boolean-input";
import { NullableColorInput } from "../inputs/color-input";
import { KeyValueArrayInput } from "../inputs/key-value-array-input";

type StatsProps = {
  style?: Record<string, unknown> | null;
  props?: {
    items?: { value: string; label: string }[] | null;
    columns?: 2 | 3 | 4 | null;
    showDividers?: boolean | null;
    cardBackgroundColor?: string | null;
    variant?: "row" | "cards" | null;
  } | null;
};

interface StatsSidebarPanelProps {
  data: StatsProps;
  onUpdate: (data: StatsProps) => void;
}

export function StatsSidebarPanel({ data, onUpdate }: StatsSidebarPanelProps) {
  function updateData(next: Partial<StatsProps>) {
    const merged = { ...data, ...next };
    const parsed = StatsPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const items = (data.props?.items ?? []).map((item) => ({
    key: item.value,
    value: item.label,
  }));

  return (
    <BaseSidebarPanel title="Stats">
      <RadioGroupInput
        label="Variant"
        value={data.props?.variant ?? "row"}
        onChange={(variant) =>
          updateData({
            props: {
              ...data.props,
              variant: variant as "row" | "cards",
            },
          })
        }
        options={[
          { value: "row", label: "Row" },
          { value: "cards", label: "Cards" },
        ]}
      />
      <KeyValueArrayInput
        label="Stats"
        items={items}
        onChange={(kvItems) =>
          updateData({
            props: {
              ...data.props,
              items: kvItems.map((kv) => ({ value: kv.key, label: kv.value })),
            },
          })
        }
        keyLabel="Value"
        valueLabel="Label"
        maxItems={6}
      />
      <RadioGroupInput
        label="Columns"
        value={(data.props?.columns ?? 3).toString()}
        onChange={(columns) =>
          updateData({
            props: {
              ...data.props,
              columns: Number(columns) as 2 | 3 | 4,
            },
          })
        }
        options={[
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ]}
      />
      <BooleanInput
        label="Show dividers"
        value={data.props?.showDividers}
        onChange={(showDividers) =>
          updateData({ props: { ...data.props, showDividers } })
        }
      />
      <NullableColorInput
        label="Card background"
        value={data.props?.cardBackgroundColor}
        onChange={(cardBackgroundColor) =>
          updateData({ props: { ...data.props, cardBackgroundColor } })
        }
        defaultValue="#f8f8f8"
      />
    </BaseSidebarPanel>
  );
}
