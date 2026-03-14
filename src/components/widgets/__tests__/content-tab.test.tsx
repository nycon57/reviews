// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import type { WidgetEntityType, WidgetType } from "@/lib/widgets/types";
import { ContentTab } from "../sidebar/content-tab";

const { getEntityCtaDefaults } = vi.hoisted(() => ({
  getEntityCtaDefaults: vi.fn<
    (entityType: WidgetEntityType, entityId: string | null) => Promise<{ success: boolean; data?: { text: string; url: string } }>
  >(),
}));

vi.mock("@/lib/widgets/actions", () => ({
  getEntityCtaDefaults,
}));

function mergeConfig(
  base: WidgetConfigJson,
  partial: Partial<WidgetConfigJson>,
): WidgetConfigJson {
  const next: WidgetConfigJson = { ...base };

  for (const [key, value] of Object.entries(partial)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const existing = next[key as keyof WidgetConfigJson];
      next[key as keyof WidgetConfigJson] =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? { ...(existing as Record<string, unknown>), ...(value as Record<string, unknown>) }
          : (value as never);
      continue;
    }

    next[key as keyof WidgetConfigJson] = value as never;
  }

  return next;
}

function Harness({
  widgetType,
  entityType,
  entityId,
  initialConfig,
}: {
  widgetType: WidgetType;
  entityType: WidgetEntityType;
  entityId: string | null;
  initialConfig?: WidgetConfigJson;
}) {
  const [config, setConfig] = React.useState<WidgetConfigJson>(
    initialConfig ?? {
      content: {
        showCTA: true,
      },
    },
  );

  return (
    <ContentTab
      config={config}
      widgetType={widgetType}
      entityType={entityType}
      entityId={entityId}
      onConfigChange={(partial) => {
        setConfig((prev) => mergeConfig(prev, partial));
      }}
    />
  );
}

describe("ContentTab", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    getEntityCtaDefaults.mockImplementation(async (entityType, entityId) => {
      if (entityType === "branch") {
        return {
          success: true,
          data: {
            text: "View Profile",
            url: "https://app.repwell.com/branch/downtown-austin",
          },
        };
      }

      if (entityType === "organization") {
        return {
          success: true,
          data: {
            text: "View Profile",
            url: "https://app.repwell.com/org/horizon-mortgage-group",
          },
        };
      }

      return {
        success: true,
        data: {
          text: "View Profile",
          url:
            entityId === "user-2"
              ? "https://app.repwell.com/pro/jamie-rivers"
              : "https://app.repwell.com/pro/alex-morgan",
        },
      };
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
    getEntityCtaDefaults.mockReset();
  });

  it("shows truncate only for widgets that render configurable review snippets", async () => {
    await act(async () => {
      root.render(
        <Harness widgetType="lo_review" entityType="user" entityId="user-1" />,
      );
    });

    expect(container.textContent).toContain("Truncate Length");

    await act(async () => {
      root.render(
        <Harness
          widgetType="video_testimonial"
          entityType="user"
          entityId="user-1"
        />,
      );
    });

    expect(container.textContent).not.toContain("Truncate Length");
  });

  it("auto-fills CTA defaults, freezes after customization, and resets to the latest entity default", async () => {
    await act(async () => {
      root.render(
        <Harness widgetType="lo_review" entityType="user" entityId="user-1" />,
      );
    });

    const ctaInputs = () =>
      Array.from(
        container.querySelectorAll<HTMLInputElement>(
          'input:not([type="hidden"])',
        ),
      ).slice(-2);

    expect(
      ctaInputs()[0]?.getAttribute("value") ?? ctaInputs()[0]?.value,
    ).toBe(
      "View Profile",
    );
    expect(
      ctaInputs()[1]?.getAttribute("value") ?? ctaInputs()[1]?.value,
    ).toBe(
      "https://app.repwell.com/pro/alex-morgan",
    );

    await act(async () => {
      const textInput = ctaInputs()[0];
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(textInput, "Apply Now");
      textInput.dispatchEvent(new Event("input", { bubbles: true }));
      textInput.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      root.render(
        <Harness widgetType="lo_review" entityType="user" entityId="user-2" />,
      );
    });

    expect(
      ctaInputs()[0]?.getAttribute("value") ?? ctaInputs()[0]?.value,
    ).toBe(
      "Apply Now",
    );
    expect(
      ctaInputs()[1]?.getAttribute("value") ?? ctaInputs()[1]?.value,
    ).toBe(
      "https://app.repwell.com/pro/alex-morgan",
    );

    const resetButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Reset to default"),
    );

    expect(resetButton).toBeTruthy();

    await act(async () => {
      resetButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0 }),
      );
    });

    expect(
      ctaInputs()[0]?.getAttribute("value") ?? ctaInputs()[0]?.value,
    ).toBe(
      "View Profile",
    );
    expect(
      ctaInputs()[1]?.getAttribute("value") ?? ctaInputs()[1]?.value,
    ).toBe(
      "https://app.repwell.com/pro/jamie-rivers",
    );
  });

  it("derives organization and branch profile URLs for CTA defaults", async () => {
    await act(async () => {
      root.render(
        <Harness
          widgetType="branch_review"
          entityType="branch"
          entityId="branch-1"
        />,
      );
    });

    let inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])'),
    ).slice(-2);
    expect(inputs[1]?.getAttribute("value") ?? inputs[1]?.value).toBe(
      "https://app.repwell.com/branch/downtown-austin",
    );

    await act(async () => {
      root.render(
        <Harness
          widgetType="company_review"
          entityType="organization"
          entityId={null}
        />,
      );
    });

    inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])'),
    ).slice(-2);
    expect(inputs[1]?.getAttribute("value") ?? inputs[1]?.value).toBe(
      "https://app.repwell.com/org/horizon-mortgage-group",
    );
  });
});
