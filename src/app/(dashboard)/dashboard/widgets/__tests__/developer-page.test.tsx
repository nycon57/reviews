// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import DeveloperPage from "../developer/page";

describe("DeveloperPage", () => {
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

  it("documents only runtime overrides supported by the embed script", async () => {
    await act(async () => {
      root.render(<DeveloperPage />);
    });

    expect(container.textContent).toContain("Widget Developer API");
    expect(container.textContent).toContain("RepWell.configure()");
    expect(container.textContent).toContain("content.ctaUrl");
    expect(container.textContent).not.toContain("content.headerText");
    expect(container.textContent).not.toContain("headerText: 'What Our Clients Say'");
  });
});
