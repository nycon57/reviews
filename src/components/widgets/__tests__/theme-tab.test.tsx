// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import { ThemeTab } from "../sidebar/theme-tab";

vi.mock("../theme-preset-selector", () => ({
  ThemePresetSelector: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <select
      aria-label="Theme Preset"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="clean_white">Clean White</option>
      <option value="custom">Custom</option>
    </select>
  ),
}));

vi.mock("../sidebar/shared-fields", () => ({
  ColorField: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock("@/lib/widgets/actions", () => ({
  getOrgBrandColors: vi.fn(),
}));

vi.mock("@/components/ui/select", () => {
  const SelectItem = ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => (
    <div data-value={value}>
      {children}
    </div>
  );

  const collectItems = (node: React.ReactNode): Array<{ value: string; label: string }> => {
    const items: Array<{ value: string; label: string }> = [];

    for (const child of React.Children.toArray(node)) {
      if (!React.isValidElement(child)) continue;

      if (child.type === SelectItem) {
        items.push({
          value: child.props.value,
          label: React.Children.toArray(child.props.children)
            .map((item) => (typeof item === "string" ? item : ""))
            .join(""),
        });
        continue;
      }

      items.push(...collectItems(child.props.children));
    }

    return items;
  };

  const Select = ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) => {
    const items = collectItems(children);

    return (
      <select
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  };

  return {
    Select,
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    SelectItem,
  };
});

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, className }: { value: number[]; className?: string }) => (
    <div
      role="slider"
      aria-valuenow={value[0]}
      className={className}
    />
  ),
}));

describe("ThemeTab", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("uses fixed selects for typography and layout sizing fields", async () => {
    const onConfigChange = vi.fn();
    const config: WidgetConfigJson = {
      theme: {
        preset: "clean_white",
        typography: {
          fontFamily: "system-ui",
          headerSize: "18px",
          bodySize: "14px",
        },
        layout: {
          maxWidth: "600px",
          padding: "16px",
          borderRadius: "8px",
          shadow: "sm",
        },
      },
    };

    await act(async () => {
      root.render(<ThemeTab config={config} widgetType="review_wall" onConfigChange={onConfigChange} />);
    });

    const selects = Array.from(container.querySelectorAll("select"));
    const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
    const headingSizeSelect = selects.find((select) => {
      const optionValues = Array.from(select.querySelectorAll("option")).map((option) => option.value);
      return optionValues.includes("32px") && !optionValues.includes("10px");
    });
    const bodySizeSelect = selects.find((select) =>
      Array.from(select.querySelectorAll("option")).some(
        (option) => option.value === "10px",
      ),
    );
    const maxWidthSelect = selects.find((select) => {
      const optionValues = Array.from(select.querySelectorAll("option")).map((option) => option.value);
      return optionValues.includes("300px") && optionValues.includes("1200px");
    });
    const paddingSelect = selects.find((select) => {
      const optionValues = Array.from(select.querySelectorAll("option")).map((option) => option.value);
      return optionValues.includes("48px");
    });
    const borderRadiusSelect = selects.find((select) => {
      const optionValues = Array.from(select.querySelectorAll("option")).map((option) => option.value);
      return optionValues.includes("0px") && optionValues.includes("24px") && !optionValues.includes("48px");
    });

    expect(selects).toHaveLength(8);
    expect(sliders).toHaveLength(0);
    expect(headingSizeSelect).toBeDefined();
    expect(bodySizeSelect).toBeDefined();
    expect(maxWidthSelect).toBeDefined();
    expect(paddingSelect).toBeDefined();
    expect(borderRadiusSelect).toBeDefined();
    expect(headingSizeSelect?.value).toBe("18px");
    expect(bodySizeSelect?.value).toBe("14px");
    expect(maxWidthSelect?.value).toBe("600px");
    expect(paddingSelect?.value).toBe("16px");
    expect(borderRadiusSelect?.value).toBe("8px");

    headingSizeSelect!.value = "24px";
    await act(async () => {
      headingSizeSelect?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onConfigChange).toHaveBeenLastCalledWith({
      theme: {
        ...config.theme,
        typography: {
          ...config.theme?.typography,
          headerSize: "24px",
        },
      },
    });

    maxWidthSelect!.value = "720px";
    await act(async () => {
      maxWidthSelect?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(onConfigChange).toHaveBeenLastCalledWith({
      theme: {
        ...config.theme,
        layout: {
          ...config.theme?.layout,
          maxWidth: "720px",
        },
      },
    });
  });
});
