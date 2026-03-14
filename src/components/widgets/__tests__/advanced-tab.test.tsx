// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import { AdvancedTab } from "../sidebar/advanced-tab";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdvancedTab", () => {
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

  it("keeps advanced focused on CSS and links out to the developer API", async () => {
    const config: WidgetConfigJson = {};
    const onDomainsChange = vi.fn();

    await act(async () => {
      root.render(
        <AdvancedTab
          allowedDomains={["app.repwell.com"]}
          config={config}
          onConfigChange={vi.fn()}
          onDomainsChange={onDomainsChange}
        />,
      );
    });

    expect(container.textContent).toContain("Custom CSS");
    expect(container.textContent).toContain("Allowed Domains");
    expect(container.textContent).toContain(
      "Restrict which domains can embed this widget. Leave empty to allow all domains.",
    );
    expect(container.textContent).toContain("app.repwell.com");
    expect(container.textContent).toContain("Developer API");
    expect(container.textContent).toContain(
      "Hooks, runtime configuration, and dynamic entity overrides live in the dedicated developer docs."
    );
    expect(container.textContent).not.toContain("JavaScript Hooks API");

    const docsLink = container.querySelector(
      'a[href="/dashboard/widgets/developer"]',
    );

    expect(docsLink?.textContent).toContain("Open docs");
  });
});
