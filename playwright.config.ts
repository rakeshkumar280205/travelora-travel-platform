import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const isolatedDatabaseUrl = process.env.E2E_DATABASE_URL;
const configuredDatabaseUrl = process.env.DATABASE_URL;

if (
  isolatedDatabaseUrl &&
  configuredDatabaseUrl &&
  isolatedDatabaseUrl === configuredDatabaseUrl
) {
  throw new Error("E2E_DATABASE_URL must not equal DATABASE_URL.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/admin/signin`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...(isolatedDatabaseUrl ? { DATABASE_URL: isolatedDatabaseUrl } : {}),
      NODE_ENV: "test",
    },
  },
});
