import { test, expect } from "@playwright/test";

const hasIsolatedDatabase = Boolean(process.env.E2E_DATABASE_URL);
const allowMutations = process.env.E2E_ALLOW_MUTATIONS === "true";

test.describe("public visitor journeys", () => {
  test("admin sign-in page loads without authentication", async ({ page }) => {
    await page.goto("/admin/signin");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("invalid sign-in displays a safe error", async ({ page }) => {
    test.skip(!hasIsolatedDatabase, "Set E2E_DATABASE_URL for credential validation.");
    await page.goto("/admin/signin");
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("not-a-real-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "The email or password was not recognised.",
    );
  });

  test.describe("database-backed public pages", () => {
    test.skip(!hasIsolatedDatabase, "Set E2E_DATABASE_URL to an isolated test database.");

    test("homepage and package listing load", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /Discover South India/i })).toBeVisible();
      await page.goto("/packages");
      await expect(page.getByRole("heading", { name: /Journeys with a sense of place/i })).toBeVisible();
    });

    test("search and filter reduce package results", async ({ page }) => {
      await page.goto("/packages");
      const results = page.locator("#results-heading");
      await expect(results).toContainText("journeys found");
      await page.getByLabel("Search by title or destination").fill("Kerala");
      await expect(results).toContainText("1 journey found");
      await expect(page.getByRole("link", { name: /Munnar, Thekkady and Alleppey Houseboat/i })).toBeVisible();
    });

    test("published detail loads and draft is not publicly exposed", async ({ page }) => {
      await page.goto("/packages/PKG-KL-07");
      await expect(page.getByRole("heading", { name: /Munnar, Thekkady and Alleppey Houseboat/i })).toBeVisible();
      const draftResponse = await page.goto("/packages/PKG-SI-12");
      expect(draftResponse?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
    });

    test("enquiry form validates missing and invalid input", async ({ page }) => {
      await page.goto("/");
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send enquiry" }) });
      await form.getByRole("button", { name: "Send enquiry" }).click();
      await expect(form.getByLabel("Name")).toBeFocused();
      await form.getByLabel("Name").fill("Test Traveller");
      await form.getByLabel("Email").fill("not-an-email");
      await form.getByLabel("Destination").fill("Kerala");
      await form.getByLabel("Adults").fill("2");
      await expect(form.getByLabel("Email")).toHaveValue("not-an-email");
      await form.getByLabel("Additional message").fill("A valid length message for this test.");
      await form.getByRole("button", { name: "Send enquiry" }).click();
      await expect(form.getByRole("status")).toContainText(/valid email|email/i);
    });

    test("enquiry acknowledgement is shown only in an explicitly isolated mutation run", async ({ page }) => {
      test.skip(
        !allowMutations,
        "Set E2E_ALLOW_MUTATIONS=true only with a disposable E2E_DATABASE_URL.",
      );
      await page.goto("/");
      const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Send enquiry" }) });
      await form.getByLabel("Name").fill("Playwright Test Traveller");
      await form.getByLabel("Email").fill("playwright@example.test");
      await form.getByLabel("Destination").fill("Kerala");
      await form.getByLabel("Adults").fill("2");
      await form.getByLabel("Additional message").fill("Please help plan a test journey.");
      await form.getByRole("button", { name: "Send enquiry" }).click();
      await expect(form.getByRole("status")).toContainText(/thank you|in touch/i);
    });
  });
});
