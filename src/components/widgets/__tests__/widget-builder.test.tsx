// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfig } from "@/lib/widgets/types";
import { WidgetBuilder } from "../widget-builder";

const { push, refresh, updateWidget, toast } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  updateWidget: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

vi.mock("@/lib/widgets/actions", () => ({
  updateWidget,
}));

vi.mock("../widget-builder-sidebar", () => ({
  WidgetBuilderSidebar: ({
    onDomainsChange,
  }: {
    onDomainsChange: (domains: string[]) => void;
  }) => (
    <button type="button" onClick={() => onDomainsChange(["example.com"])}>
      Mark dirty
    </button>
  ),
}));

vi.mock("../widget-preview", () => ({
  WidgetPreview: () => <div>Preview</div>,
}));

describe("WidgetBuilder", () => {
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
    updateWidget.mockResolvedValue({
      success: true,
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        widget_id: "widget-123",
        version: 4,
      },
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    push.mockReset();
    refresh.mockReset();
    updateWidget.mockReset();
    toast.mockReset();
  });

  it("saves widget changes without sending hidden SEO editor fields", async () => {
    const widget: WidgetConfig = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      widget_id: "widget-123",
      name: "Widget 123",
      organization_id: "223e4567-e89b-12d3-a456-426614174000",
      created_by: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      status: "active",
      ab_test_group: null,
      parent_widget_id: null,
      widget_type: "lo_review",
      entity_type: "user",
      entity_id: null,
      config: {
        theme: {
          preset: "clean_white",
        },
        content: {
          showHeader: true,
        },
        filters: {
          minRating: 1,
          maxReviews: 10,
          sortOrder: "newest",
        },
      },
      allowed_domains: ["example.com"],
      enable_structured_data: true,
      structured_data_type: "FinancialService",
      version: 3,
    };

    await act(async () => {
      root.render(<WidgetBuilder widget={widget} />);
    });

    // Save stays disabled until there are unsaved changes; mark the builder dirty
    // via the sidebar before attempting to save.
    const dirtyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Mark dirty"),
    );

    await act(async () => {
      dirtyButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0 }),
      );
    });

    const saveButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Save"),
    );

    expect(saveButton).toBeTruthy();

    await act(async () => {
      saveButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0 }),
      );
    });

    expect(updateWidget).toHaveBeenCalledTimes(1);
    expect(updateWidget).toHaveBeenCalledWith({
      id: "123e4567-e89b-12d3-a456-426614174000",
      config: widget.config,
      allowed_domains: ["example.com"],
      entity_id: undefined,
      entity_type: "user",
    });

    const payload = updateWidget.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("enable_structured_data");
    expect(payload).not.toHaveProperty("structured_data_type");
  });
});
