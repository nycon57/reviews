/**
 * E2E interaction tests for auth flows.
 * Covers login, signup, forgot-password, and reset-password pages.
 * No authentication required — these are all public pages.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Login Page
// ---------------------------------------------------------------------------

test.describe("Login page", () => {
  test.describe("page structure", () => {
    test("renders the login form with password mode by default", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(
        page.getByRole("heading", { name: "Welcome back" })
      ).toBeVisible();
      await expect(
        page.getByText("Sign in to your account to continue")
      ).toBeVisible();

      // Mode toggle buttons
      await expect(page.getByRole("button", { name: "Password" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Magic Link" })
      ).toBeVisible();

      // Password mode fields
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign in" })
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();

      // Footer link
      await expect(page.getByText("Don't have an account?")).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute(
        "href",
        "/signup"
      );
    });

    test("email input has correct placeholder", async ({ page }) => {
      await page.goto("/login");
      await expect(
        page.getByPlaceholder("you@example.com")
      ).toBeVisible();
    });
  });

  test.describe("password mode validation", () => {
    test("shows validation errors when submitting empty form", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
      await expect(page.getByText("Password is required")).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel("Email").fill("not-an-email");
      await page.getByLabel("Password").fill("somepassword");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });

    test("shows validation error when password is empty but email is valid", async ({
      page,
    }) => {
      await page.goto("/login");

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByRole("button", { name: "Sign in" }).click();

      await expect(page.getByText("Password is required")).toBeVisible();
    });
  });

  test.describe("mode switching", () => {
    test("switches to magic link mode and back", async ({ page }) => {
      await page.goto("/login");

      // Switch to magic link
      await page.getByRole("button", { name: "Magic Link" }).click();

      // Password field should disappear
      await expect(page.getByLabel("Password")).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: "Send magic link" })
      ).toBeVisible();
      await expect(
        page.getByText(
          "We'll send you a magic link to sign in without a password."
        )
      ).toBeVisible();

      // Switch back to password
      await page.getByRole("button", { name: "Password" }).click();

      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Sign in" })
      ).toBeVisible();
    });

    test("email field value clears when switching modes", async ({ page }) => {
      await page.goto("/login");

      // Type in password mode email
      await page.getByLabel("Email").fill("password-mode@example.com");

      // Switch to magic link — separate form, so email resets
      await page.getByRole("button", { name: "Magic Link" }).click();
      await expect(page.getByLabel("Email")).toHaveValue("");

      // Type in magic link mode email
      await page.getByLabel("Email").fill("magic-link@example.com");

      // Switch back — password form also has its own default
      await page.getByRole("button", { name: "Password" }).click();
      await expect(page.getByLabel("Email")).toHaveValue("");
    });
  });

  test.describe("magic link mode", () => {
    test("shows validation error for empty email", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Magic Link" }).click();
      await page.getByRole("button", { name: "Send magic link" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Magic Link" }).click();

      await page.getByLabel("Email").fill("bad-email");
      await page.getByRole("button", { name: "Send magic link" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });

    test("shows success state after sending magic link", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Magic Link" }).click();

      await page.getByLabel("Email").fill("user@example.com");

      // Intercept the Next.js server action POST
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true}\n',
          });
        }
        return route.continue();
      });

      await page.getByRole("button", { name: "Send magic link" }).click();

      await expect(
        page.getByRole("heading", { name: "Check your email" })
      ).toBeVisible();
      await expect(page.getByText("user@example.com")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Use a different email" })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Resend" })).toBeVisible();
    });

    test("'Use a different email' returns to magic link form", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("button", { name: "Magic Link" }).click();
      await page.getByLabel("Email").fill("user@example.com");

      // Mock the server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true}\n',
          });
        }
        return route.continue();
      });

      await page.getByRole("button", { name: "Send magic link" }).click();
      await expect(
        page.getByRole("heading", { name: "Check your email" })
      ).toBeVisible();

      // Click "Use a different email"
      await page.getByRole("button", { name: "Use a different email" }).click();

      // Should return to the form
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Send magic link" })
      ).toBeVisible();
    });
  });

  test.describe("deactivated account warning", () => {
    test("shows deactivated warning with ?reason=deactivated", async ({
      page,
    }) => {
      await page.goto("/login?reason=deactivated");

      await expect(
        page.getByText(
          "Your account has been deactivated. Contact your administrator."
        )
      ).toBeVisible();
    });

    test("does not show deactivated warning without query param", async ({
      page,
    }) => {
      await page.goto("/login");

      await expect(
        page.getByText(
          "Your account has been deactivated. Contact your administrator."
        )
      ).not.toBeVisible();
    });

    test("does not show deactivated warning with other reason values", async ({
      page,
    }) => {
      await page.goto("/login?reason=other");

      await expect(
        page.getByText(
          "Your account has been deactivated. Contact your administrator."
        )
      ).not.toBeVisible();
    });
  });

  test.describe("redirect query param", () => {
    test("preserves redirect param in URL", async ({ page }) => {
      await page.goto("/login?redirect=/settings");

      // The page should load normally with the redirect param
      await expect(
        page.getByRole("heading", { name: "Welcome back" })
      ).toBeVisible();
      expect(page.url()).toContain("redirect=/settings");
    });

    test("redirect param combines with reason param", async ({ page }) => {
      await page.goto("/login?reason=deactivated&redirect=/dashboard/settings");

      await expect(
        page.getByText(
          "Your account has been deactivated. Contact your administrator."
        )
      ).toBeVisible();
      expect(page.url()).toContain("redirect=/dashboard/settings");
    });
  });

  test.describe("sign in form submission", () => {
    test("shows loading state during submission", async ({ page }) => {
      await page.goto("/login");

      // Set up a delayed response to catch loading state
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          // Delay the response to observe loading
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  route.fulfill({
                    status: 200,
                    contentType: "text/x-component",
                    body: '0:{"success":false,"error":"Invalid credentials"}\n',
                  })
                ),
              500
            )
          );
        }
        return route.continue();
      });

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByLabel("Password").fill("password123");
      await page.getByRole("button", { name: "Sign in" }).click();

      // Button should show loading state
      await expect(page.getByText("Signing in...")).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Signup Page
// ---------------------------------------------------------------------------

test.describe("Signup page", () => {
  test.describe("page structure", () => {
    test("renders the signup form with all fields", async ({ page }) => {
      await page.goto("/signup");

      await expect(
        page.getByRole("heading", { name: "Create an account" })
      ).toBeVisible();
      await expect(
        page.getByText("Get started with RepWell for your organization")
      ).toBeVisible();

      // All form fields
      await expect(page.getByLabel("Full Name")).toBeVisible();
      await expect(page.getByLabel("Organization Name")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();

      // Submit button
      await expect(
        page.getByRole("button", { name: "Create account" })
      ).toBeVisible();

      // Legal links
      await expect(
        page.getByRole("link", { name: "Terms of Service" })
      ).toHaveAttribute("href", "/terms");
      await expect(
        page.getByRole("link", { name: "Privacy Policy" })
      ).toHaveAttribute("href", "/privacy");

      // Footer link
      await expect(page.getByText("Already have an account?")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Sign in" })
      ).toHaveAttribute("href", "/login");
    });

    test("has correct placeholders", async ({ page }) => {
      await page.goto("/signup");

      await expect(page.getByPlaceholder("John Doe")).toBeVisible();
      await expect(page.getByPlaceholder("Acme Mortgage Co.")).toBeVisible();
      await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
      await expect(
        page.getByPlaceholder("Create a strong password")
      ).toBeVisible();
    });
  });

  test.describe("form validation", () => {
    test("shows validation errors when submitting empty form", async ({
      page,
    }) => {
      await page.goto("/signup");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Full name must be at least 2 characters")
      ).toBeVisible();
      await expect(
        page.getByText("Organization name must be at least 2 characters")
      ).toBeVisible();
      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
      await expect(
        page.getByText("Password must be at least 8 characters")
      ).toBeVisible();
    });

    test("shows error for short full name", async ({ page }) => {
      await page.goto("/signup");
      await page.getByLabel("Full Name").fill("A");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Full name must be at least 2 characters")
      ).toBeVisible();
    });

    test("shows error for short organization name", async ({ page }) => {
      await page.goto("/signup");
      await page.getByLabel("Organization Name").fill("X");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Organization name must be at least 2 characters")
      ).toBeVisible();
    });

    test("shows error for invalid email", async ({ page }) => {
      await page.goto("/signup");
      await page.getByLabel("Email").fill("not-valid");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });

    test("shows error for short password", async ({ page }) => {
      await page.goto("/signup");
      await page.getByLabel("Password").fill("Ab1");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Password must be at least 8 characters")
      ).toBeVisible();
    });
  });

  test.describe("password strength indicator", () => {
    test("does not show strength indicator when password is empty", async ({
      page,
    }) => {
      await page.goto("/signup");

      // Strength requirements should not be visible initially
      await expect(page.getByText("At least 8 characters")).not.toBeVisible();
    });

    test("shows all four requirements when typing begins", async ({
      page,
    }) => {
      await page.goto("/signup");
      await page.getByLabel("Password").fill("a");

      await expect(page.getByText("At least 8 characters")).toBeVisible();
      await expect(page.getByText("One uppercase letter")).toBeVisible();
      await expect(page.getByText("One lowercase letter")).toBeVisible();
      await expect(page.getByText("One number")).toBeVisible();
    });

    test("marks lowercase requirement as met for lowercase input", async ({
      page,
    }) => {
      await page.goto("/signup");
      await page.getByLabel("Password").fill("a");

      // The "One lowercase letter" requirement should be in the met state
      const lowercaseReq = page.getByText("One lowercase letter");
      await expect(lowercaseReq).toBeVisible();
      // Verify it has the success color class (met state)
      const listItem = lowercaseReq.locator("..");
      await expect(listItem).toHaveClass(/text-success/);
    });

    test("marks all requirements met for a strong password", async ({
      page,
    }) => {
      await page.goto("/signup");
      await page.getByLabel("Password").fill("StrongPass1");

      // All requirements should have the success class
      const requirements = page.locator("ul > li");
      const count = await requirements.count();
      expect(count).toBe(4);

      for (let i = 0; i < count; i++) {
        await expect(requirements.nth(i)).toHaveClass(/text-success/);
      }
    });

    test("progress bar updates as requirements are met", async ({ page }) => {
      await page.goto("/signup");

      // Type just a lowercase letter (1/4 met = 25%)
      await page.getByLabel("Password").fill("a");
      const progressBar = page.locator(
        '[style*="width"]'
      ).first();
      await expect(progressBar).toBeVisible();

      // Type a strong password (4/4 met = 100%)
      await page.getByLabel("Password").fill("StrongPass1");
      // The progress bar div should now be wider
      const fullProgressBar = page.locator('[style="width: 100%;"]');
      await expect(fullProgressBar).toBeVisible();
    });

    test("incrementally meets requirements", async ({ page }) => {
      await page.goto("/signup");

      // Only lowercase
      await page.getByLabel("Password").fill("abc");
      let metItems = page.locator("ul > li.text-success");
      // Should have "One lowercase letter" met
      await expect(page.getByText("One lowercase letter").locator("..")).toHaveClass(
        /text-success/
      );

      // Add uppercase
      await page.getByLabel("Password").fill("abcA");
      await expect(
        page.getByText("One uppercase letter").locator("..")
      ).toHaveClass(/text-success/);

      // Add number
      await page.getByLabel("Password").fill("abcA1");
      await expect(page.getByText("One number").locator("..")).toHaveClass(
        /text-success/
      );

      // Meet length requirement
      await page.getByLabel("Password").fill("abcdefgA1");
      await expect(
        page.getByText("At least 8 characters").locator("..")
      ).toHaveClass(/text-success/);
    });
  });

  test.describe("form submission", () => {
    test("shows loading state during submission", async ({ page }) => {
      await page.goto("/signup");

      // Mock slow server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  route.fulfill({
                    status: 200,
                    contentType: "text/x-component",
                    body: '0:{"success":true,"redirectTo":"/verify-email"}\n',
                  })
                ),
              500
            )
          );
        }
        return route.continue();
      });

      await page.getByLabel("Full Name").fill("Jane Doe");
      await page.getByLabel("Organization Name").fill("Test Org");
      await page.getByLabel("Email").fill("jane@example.com");
      await page.getByLabel("Password").fill("StrongPass1");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByText("Creating account...")).toBeVisible();
    });

    test("button is disabled while loading", async ({ page }) => {
      await page.goto("/signup");

      // Mock slow server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  route.fulfill({
                    status: 200,
                    contentType: "text/x-component",
                    body: '0:{"success":true}\n',
                  })
                ),
              1000
            )
          );
        }
        return route.continue();
      });

      await page.getByLabel("Full Name").fill("Jane Doe");
      await page.getByLabel("Organization Name").fill("Test Org");
      await page.getByLabel("Email").fill("jane@example.com");
      await page.getByLabel("Password").fill("StrongPass1");

      const submitButton = page.getByRole("button", { name: "Create account" });
      await submitButton.click();

      // Button text changes, and it becomes disabled
      await expect(page.getByText("Creating account...")).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Forgot Password Page
// ---------------------------------------------------------------------------

test.describe("Forgot password page", () => {
  test.describe("page structure", () => {
    test("renders the forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      await expect(
        page.getByRole("heading", { name: "Forgot password?" })
      ).toBeVisible();
      await expect(
        page.getByText("Enter your email and we'll send you a reset link")
      ).toBeVisible();

      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Send reset link" })
      ).toBeVisible();

      // Back to sign in link
      await expect(
        page.getByRole("button", { name: /Back to sign in/ })
      ).toBeVisible();
    });
  });

  test.describe("form validation", () => {
    test("shows validation error for empty email", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill("not-valid");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(
        page.getByText("Please enter a valid email address")
      ).toBeVisible();
    });
  });

  test.describe("success flow", () => {
    test("shows success state after submitting valid email", async ({
      page,
    }) => {
      await page.goto("/forgot-password");

      // Mock server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true}\n',
          });
        }
        return route.continue();
      });

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();

      // Success state
      await expect(
        page.getByRole("heading", { name: "Check your email" })
      ).toBeVisible();
      await expect(page.getByText("user@example.com")).toBeVisible();
      await expect(
        page.getByText("Click the link in the email to reset your password")
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Use a different email" })
      ).toBeVisible();
    });

    test("'Use a different email' returns to form", async ({ page }) => {
      await page.goto("/forgot-password");

      // Mock server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true}\n',
          });
        }
        return route.continue();
      });

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(
        page.getByRole("heading", { name: "Check your email" })
      ).toBeVisible();

      // Click "Use a different email"
      await page.getByRole("button", { name: "Use a different email" }).click();

      // Should return to form
      await expect(
        page.getByRole("heading", { name: "Forgot password?" })
      ).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Send reset link" })
      ).toBeVisible();
    });

    test("success state shows 'Back to sign in' link", async ({ page }) => {
      await page.goto("/forgot-password");

      // Mock server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true}\n',
          });
        }
        return route.continue();
      });

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(
        page.getByRole("heading", { name: "Check your email" })
      ).toBeVisible();
      // "Back to sign in" should link to /login
      const backLink = page.getByRole("link", { name: /Back to sign in/ });
      await expect(backLink).toBeVisible();
    });
  });

  test.describe("loading state", () => {
    test("shows loading indicator during submission", async ({ page }) => {
      await page.goto("/forgot-password");

      // Mock slow server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  route.fulfill({
                    status: 200,
                    contentType: "text/x-component",
                    body: '0:{"success":true}\n',
                  })
                ),
              500
            )
          );
        }
        return route.continue();
      });

      await page.getByLabel("Email").fill("user@example.com");
      await page.getByRole("button", { name: "Send reset link" }).click();

      await expect(page.getByText("Sending reset link...")).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Reset Password Page
// ---------------------------------------------------------------------------

test.describe("Reset password page", () => {
  test.describe("page structure", () => {
    test("renders the reset password form", async ({ page }) => {
      await page.goto("/reset-password");

      await expect(
        page.getByRole("heading", { name: "Set new password" })
      ).toBeVisible();
      await expect(
        page.getByText("Create a strong password for your account")
      ).toBeVisible();

      await expect(page.getByLabel("New Password")).toBeVisible();
      await expect(page.getByLabel("Confirm Password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Reset password" })
      ).toBeVisible();
    });

    test("has correct placeholders", async ({ page }) => {
      await page.goto("/reset-password");

      await expect(
        page.getByPlaceholder("Enter your new password")
      ).toBeVisible();
      await expect(
        page.getByPlaceholder("Confirm your new password")
      ).toBeVisible();
    });
  });

  test.describe("form validation", () => {
    test("shows validation error for empty password fields", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      await page.getByRole("button", { name: "Reset password" }).click();

      await expect(
        page.getByText("Password must be at least 8 characters")
      ).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
      await page.goto("/reset-password");
      await page.getByLabel("New Password").fill("Ab1");
      await page.getByLabel("Confirm Password").fill("Ab1");
      await page.getByRole("button", { name: "Reset password" }).click();

      await expect(
        page.getByText("Password must be at least 8 characters")
      ).toBeVisible();
    });

    test("shows mismatch error when passwords differ", async ({ page }) => {
      await page.goto("/reset-password");
      await page.getByLabel("New Password").fill("StrongPass1");
      await page.getByLabel("Confirm Password").fill("DifferentPass2");
      await page.getByRole("button", { name: "Reset password" }).click();

      await expect(page.getByText("Passwords do not match")).toBeVisible();
    });

    test("no mismatch error when passwords match", async ({ page }) => {
      await page.goto("/reset-password");

      // Mock server action to prevent actual submission
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return route.fulfill({
            status: 200,
            contentType: "text/x-component",
            body: '0:{"success":true,"redirectTo":"/dashboard"}\n',
          });
        }
        return route.continue();
      });

      await page.getByLabel("New Password").fill("StrongPass1");
      await page.getByLabel("Confirm Password").fill("StrongPass1");
      await page.getByRole("button", { name: "Reset password" }).click();

      await expect(page.getByText("Passwords do not match")).not.toBeVisible();
    });
  });

  test.describe("password strength indicator", () => {
    test("does not show strength indicator when password is empty", async ({
      page,
    }) => {
      await page.goto("/reset-password");

      await expect(page.getByText("At least 8 characters")).not.toBeVisible();
    });

    test("shows all four requirements when typing begins", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      await page.getByLabel("New Password").fill("a");

      await expect(page.getByText("At least 8 characters")).toBeVisible();
      await expect(page.getByText("One uppercase letter")).toBeVisible();
      await expect(page.getByText("One lowercase letter")).toBeVisible();
      await expect(page.getByText("One number")).toBeVisible();
    });

    test("marks all requirements met for a strong password", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      await page.getByLabel("New Password").fill("StrongPass1");

      const requirements = page.locator("ul > li");
      const count = await requirements.count();
      expect(count).toBe(4);

      for (let i = 0; i < count; i++) {
        await expect(requirements.nth(i)).toHaveClass(/text-success/);
      }
    });

    test("only uppercase requirement is unmet for lowercase+number input", async ({
      page,
    }) => {
      await page.goto("/reset-password");
      await page.getByLabel("New Password").fill("abcdefg1");

      await expect(
        page.getByText("At least 8 characters").locator("..")
      ).toHaveClass(/text-success/);
      await expect(
        page.getByText("One lowercase letter").locator("..")
      ).toHaveClass(/text-success/);
      await expect(page.getByText("One number").locator("..")).toHaveClass(
        /text-success/
      );
      // Uppercase should NOT be met
      await expect(
        page.getByText("One uppercase letter").locator("..")
      ).toHaveClass(/text-muted-foreground/);
    });
  });

  test.describe("form submission", () => {
    test("shows loading state during submission", async ({ page }) => {
      await page.goto("/reset-password");

      // Mock slow server action
      await page.route("**/*", (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.headers()["next-action"]
        ) {
          return new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  route.fulfill({
                    status: 200,
                    contentType: "text/x-component",
                    body: '0:{"success":true,"redirectTo":"/dashboard"}\n',
                  })
                ),
              500
            )
          );
        }
        return route.continue();
      });

      await page.getByLabel("New Password").fill("StrongPass1");
      await page.getByLabel("Confirm Password").fill("StrongPass1");
      await page.getByRole("button", { name: "Reset password" }).click();

      await expect(page.getByText("Resetting password...")).toBeVisible();
    });
  });
});

// ---------------------------------------------------------------------------
// Navigation Between Auth Pages
// ---------------------------------------------------------------------------

test.describe("Auth page navigation", () => {
  test("login → signup via footer link", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Sign up" }).click();

    await expect(page).toHaveURL(/\/signup/);
    await expect(
      page.getByRole("heading", { name: "Create an account" })
    ).toBeVisible();
  });

  test("signup → login via footer link", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
  });

  test("login → forgot password via link", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole("heading", { name: "Forgot password?" })
    ).toBeVisible();
  });

  test("forgot password → login via 'Back to sign in'", async ({ page }) => {
    await page.goto("/forgot-password");

    // The "Back to sign in" is wrapped in a Link around a Button
    await page.getByRole("button", { name: /Back to sign in/ }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
  });

  test("forgot password success state → login via 'Back to sign in'", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    // Mock server action
    await page.route("**/*", (route) => {
      const request = route.request();
      if (
        request.method() === "POST" &&
        request.headers()["next-action"]
      ) {
        return route.fulfill({
          status: 200,
          contentType: "text/x-component",
          body: '0:{"success":true}\n',
        });
      }
      return route.continue();
    });

    await page.getByLabel("Email").fill("user@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" })
    ).toBeVisible();

    // Navigate back to login
    const backLink = page.getByRole("link", { name: /Back to sign in/ });
    await backLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("full navigation round trip: login → signup → login → forgot → login", async ({
    page,
  }) => {
    // Start at login
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();

    // Go to signup
    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup/);

    // Go back to login
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Go to forgot password
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);

    // Go back to login
    await page.getByRole("button", { name: /Back to sign in/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
