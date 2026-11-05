import { test, expect, type Page } from "@playwright/test";

const hasIsolatedDatabase = Boolean(process.env.E2E_DATABASE_URL);
const credentials = {
  admin: [process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD],
  editor: [process.env.E2E_EDITOR_EMAIL, process.env.E2E_EDITOR_PASSWORD],
  consultant: [process.env.E2E_CONSULTANT_EMAIL, process.env.E2E_CONSULTANT_PASSWORD],
} as const;
const hasRoleCredentials = Object.values(credentials).every(
  ([email, password]) => Boolean(email && password),
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin(?:\/)?$/);
}

test.describe("staff access boundaries", () => {
  test("unauthenticated users are redirected from protected admin pages", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/signin/);
  });

  test.describe("with isolated seeded staff fixtures", () => {
    test.skip(
      !hasIsolatedDatabase ||
        !hasRoleCredentials,
      "Set E2E_DATABASE_URL and isolated role credentials.",
    );

    test("ADMIN can access dashboard, packages and preview", async ({ page }) => {
      await signIn(page, credentials.admin[0]!, credentials.admin[1]!);
      await expect(page.getByRole("heading", { name: /Good morning, team/i })).toBeVisible();
      await page.goto("/admin/packages");
      await expect(page.getByRole("heading", { name: /Packages/i })).toBeVisible();
      const previewLink = page.getByRole("link", { name: "Preview" }).first();
      await expect(previewLink).toBeVisible();
      await previewLink.click();
      await expect(page.getByText("DRAFT PREVIEW")).toBeVisible();
    });

    test("EDITOR cannot access private enquiries", async ({ page }) => {
      await signIn(page, credentials.editor[0]!, credentials.editor[1]!);
      await page.goto("/admin/enquiries");
      await expect(page.getByRole("heading", { name: /Enquiries are restricted/i })).toBeVisible();
    });

    test("CONSULTANT can access only its assigned enquiry list", async ({ page }) => {
      await signIn(page, credentials.consultant[0]!, credentials.consultant[1]!);
      await page.goto("/admin/enquiries");
      await expect(page.getByRole("heading", { name: "Enquiries" })).toBeVisible();
      await expect(page.getByLabel("Filter by consultant")).toHaveCount(0);
      const unassignedId = process.env.E2E_UNASSIGNED_ENQUIRY_ID;
      if (unassignedId) {
        const response = await page.goto(`/admin/enquiries/${unassignedId}`);
        expect(response?.status()).toBe(404);
      }
    });
  });
});
