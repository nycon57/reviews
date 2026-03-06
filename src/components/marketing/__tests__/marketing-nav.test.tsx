// @vitest-environment jsdom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketingNav } from "../marketing-nav";

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

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock("framer-motion", () => ({
  motion: {
    header: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <header {...props}>{children}</header>
    ),
  },
}));

vi.mock("../mega-menu", () => ({
  MegaMenu: () => <div data-testid="mega-menu" />,
}));

vi.mock("../mobile-menu", () => ({
  MobileMenu: () => <div data-testid="mobile-menu" />,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

const mockUseAuth = vi.mocked(useAuth);
const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe("MarketingNav", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    mockUseAuth.mockReset();
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

  it("shows sign in and get started links for logged out visitors", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn(),
      isAuthenticated: false,
      authSystem: "better-auth",
    });

    await act(async () => {
      root.render(<MarketingNav />);
    });

    const signInLink = container.querySelector('a[href="/login"]');
    const getStartedLink = container.querySelector('a[href="/signup"]');
    const signInButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Sign In"
    );

    expect(signInLink?.textContent).toContain("Sign In");
    expect(getStartedLink?.textContent).toContain("Get Started");
    expect(signInButton).toBeUndefined();
  });

  it("shows a dashboard link for authenticated users", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: null,
      },
      loading: false,
      signOut: vi.fn(),
      isAuthenticated: true,
      authSystem: "better-auth",
    });

    await act(async () => {
      root.render(<MarketingNav />);
    });

    const dashboardLink = container.querySelector('a[href="/dashboard"]');
    const signInLink = container.querySelector('a[href="/login"]');
    const getStartedLink = container.querySelector('a[href="/signup"]');

    expect(dashboardLink?.textContent).toContain("Dashboard");
    expect(signInLink).toBeNull();
    expect(getStartedLink).toBeNull();
  });
});
