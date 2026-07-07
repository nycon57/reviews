// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmbedCodePanel } from "../embed-code-panel";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CollapsibleTrigger: ({ children, className }: { children: React.ReactNode; className?: string }) => <button type="button" className={className}>{children}</button>,
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

describe("EmbedCodePanel", () => {
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

  it("shows a save prompt until the widget has an id", async () => {
    await act(async () => {
      root.render(<EmbedCodePanel widgetId={null} entityType="user" entityId={null} organizationId="org-123" />);
    });

    expect(container.textContent).toContain("Save your widget to generate embed code.");
  });

  it("shows embed instructions and the widget id for saved widgets", async () => {
    await act(async () => {
      root.render(<EmbedCodePanel widgetId="widget-slug-123" entityType="user" entityId="user-456" organizationId="org-123" />);
    });

    expect(container.textContent).toContain("Script");
    expect(container.textContent).toContain("Iframe");
    expect(container.textContent).toContain("data-repwell-widget");
    expect(container.textContent).toContain("widget-slug-123");
    expect(container.textContent).toContain("data-repwell-entity-type");
    expect(container.textContent).toContain("data-repwell-entity-id");
  });
});
