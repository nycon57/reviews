"use client";

import { ColumnsContainerPropsSchema } from "../../blocks/schemas/columns-container-props-schema";
import { BaseSidebarPanel } from "./base-sidebar-panel";
import { RadioGroupInput } from "../inputs/radio-group-input";
import { SliderInput } from "../inputs/slider-input";
import { ColumnWidthsInput } from "../inputs/column-widths-input";
import { MultiStylePropertyPanel } from "../inputs/multi-style-property-panel";

type FixedWidths = [
  number | null | undefined,
  number | null | undefined,
  number | null | undefined,
];

type ColumnsContainerProps = {
  style?: Record<string, unknown> | null;
  props?: {
    columnsCount?: 2 | 3 | null;
    columnsGap?: number | null;
    contentAlignment?: "top" | "middle" | "bottom" | null;
    fixedWidths?: FixedWidths | null;
    columns?: { childrenIds: string[] }[] | null;
  } | null;
};

interface ColumnsContainerSidebarPanelProps {
  data: ColumnsContainerProps;
  onUpdate: (data: ColumnsContainerProps) => void;
}

export function ColumnsContainerSidebarPanel({
  data,
  onUpdate,
}: ColumnsContainerSidebarPanelProps) {
  function updateData(next: Partial<ColumnsContainerProps>) {
    const merged = { ...data, ...next };
    const parsed = ColumnsContainerPropsSchema.safeParse(merged);
    if (parsed.success) {
      onUpdate(parsed.data);
    }
  }

  const columnsCount = data.props?.columnsCount ?? 2;

  return (
    <BaseSidebarPanel title="Columns">
      <RadioGroupInput
        label="Columns"
        value={String(columnsCount)}
        onChange={(v) => {
          const newCount = Number(v) as 2 | 3;
          const cols = data.props?.columns ?? [];

          // Grow or shrink the columns array to match the new count
          const updatedColumns =
            cols.length < newCount
              ? [...cols, ...Array.from({ length: newCount - cols.length }, () => ({ childrenIds: [] as string[] }))]
              : cols.slice(0, newCount);

          updateData({
            props: {
              ...data.props,
              columnsCount: newCount,
              columns: updatedColumns,
            },
          });
        }}
        options={[
          { value: "2", label: "2" },
          { value: "3", label: "3" },
        ]}
      />
      <SliderInput
        label="Gap"
        value={data.props?.columnsGap}
        onChange={(columnsGap) =>
          updateData({ props: { ...data.props, columnsGap } })
        }
        min={0}
        max={48}
        step={4}
        suffix="px"
        defaultValue={16}
      />
      <RadioGroupInput
        label="Vertical alignment"
        value={data.props?.contentAlignment}
        onChange={(contentAlignment) =>
          updateData({
            props: {
              ...data.props,
              contentAlignment: contentAlignment as
                | "top"
                | "middle"
                | "bottom",
            },
          })
        }
        options={[
          { value: "top", label: "Top" },
          { value: "middle", label: "Mid" },
          { value: "bottom", label: "Bot" },
        ]}
      />
      <ColumnWidthsInput
        label="Fixed widths"
        value={data.props?.fixedWidths}
        onChange={(fixedWidths) =>
          updateData({ props: { ...data.props, fixedWidths } })
        }
        columnsCount={columnsCount}
      />
      <MultiStylePropertyPanel
        names={["backgroundColor", "padding"]}
        value={data.style as Record<string, unknown> | null}
        onChange={(style) => updateData({ style })}
      />
    </BaseSidebarPanel>
  );
}
