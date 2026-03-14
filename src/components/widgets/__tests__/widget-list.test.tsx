// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WidgetList } from "../widget-list";
import { WIDGET_TYPE_DESCRIPTIONS } from "@/lib/widgets/constants";
import type { WidgetConfig, WidgetType } from "@/lib/widgets/types";

const { mockPush, mockToast } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

function makeWidget(widgetType: WidgetType, id: string): WidgetConfig {
  return {
    id,
    organization_id: "org-1",
    name: `${widgetType} widget`,
    widget_id: `${widgetType}-public-id`,
    widget_type: widgetType,
    entity_type: "organization",
    entity_id: null,
    status: "active",
    config: {},
    allowed_domains: null,
    ab_test_group: null,
    created_by: null,
    created_at: "2026-03-07T00:00:00.000Z",
    updated_at: "2026-03-07T00:00:00.000Z",
    enable_structured_data: false,
    structured_data_type: null,
    parent_widget_id: null,
    version: 1,
  };
}

describe("WidgetList", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    mockPush.mockReset();
    mockToast.mockReset();

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

  it("uses a 3-column desktop grid and shows descriptions for each widget", async () => {
    await act(async () => {
      root.render(
        <WidgetList
          widgets={[
            makeWidget("review_wall", "widget-1"),
            makeWidget("star_rating_badge", "widget-2"),
          ]}
        />
      );
    });

    const grid = Array.from(container.querySelectorAll("div")).find((element) => {
      const className = element.getAttribute("class") ?? "";
      return className.includes("grid-cols-1") && className.includes("gap-4");
    });

    expect(grid).toBeTruthy();
    expect(grid?.getAttribute("class")).toContain("xl:grid-cols-3");
    expect(grid?.getAttribute("class")).not.toContain("xl:grid-cols-4");
    expect(container.textContent).toContain(WIDGET_TYPE_DESCRIPTIONS.review_wall);
    expect(container.textContent).toContain(WIDGET_TYPE_DESCRIPTIONS.star_rating_badge);
  });
});
