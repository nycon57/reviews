// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VersionList } from "../version-history/version-list";

const { listWidgetVersionsMock } = vi.hoisted(() => ({
  listWidgetVersionsMock: vi.fn(),
}));

vi.mock("@/lib/widgets/version-actions", () => ({
  listWidgetVersions: listWidgetVersionsMock,
}));

vi.mock("../version-history/rollback-dialog", () => ({
  RollbackDialog: () => null,
}));

vi.mock("../version-history/version-diff", () => ({
  VersionDiff: () => null,
}));

describe("VersionList", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    listWidgetVersionsMock.mockReset();

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

  it("shows an explicit error instead of the empty-state message when loading fails", async () => {
    listWidgetVersionsMock.mockResolvedValue({
      success: false,
      error: "Organization not found",
    });

    await act(async () => {
      root.render(
        <VersionList
          widgetConfigId="widget-001"
          currentVersion={3}
        />
      );
    });

    expect(container.textContent).toContain("Unable to load version history");
    expect(container.textContent).toContain("Organization not found");
    expect(container.textContent).not.toContain("No version history yet");
  });
});
