// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardLayout } from "../dashboard-layout";

vi.mock("../sidebar", () => ({
  Sidebar: () => <aside>Sidebar</aside>,
}));

vi.mock("../header", () => ({
  Header: () => <header>Header</header>,
}));

vi.mock("../mobile-nav", () => ({
  MobileNavTrigger: () => <button type="button">Open menu</button>,
}));

vi.mock("@/lib/permissions/context", () => ({
  PermissionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/organization", () => ({
  stopUserImpersonation: vi.fn(),
}));

describe("DashboardLayout", () => {
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
    document.documentElement.style.overflow = "";
    document.documentElement.style.overscrollBehavior = "";
    document.body.style.overflow = "";
    document.body.style.overscrollBehavior = "";
  });

  it("locks document scrolling while mounted", async () => {
    await act(async () => {
      root.render(
        <DashboardLayout>
          <div>Dashboard content</div>
        </DashboardLayout>,
      );
    });

    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overscrollBehavior).toBe("none");
    expect(document.body.style.overscrollBehavior).toBe("none");
  });

  it("restores previous document scroll styles on unmount", async () => {
    document.documentElement.style.overflow = "scroll";
    document.documentElement.style.overscrollBehavior = "contain";
    document.body.style.overflow = "auto";
    document.body.style.overscrollBehavior = "auto";

    await act(async () => {
      root.render(
        <DashboardLayout>
          <div>Dashboard content</div>
        </DashboardLayout>,
      );
    });

    await act(async () => {
      root.unmount();
    });

    expect(document.documentElement.style.overflow).toBe("scroll");
    expect(document.documentElement.style.overscrollBehavior).toBe("contain");
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.overscrollBehavior).toBe("auto");
  });
});
