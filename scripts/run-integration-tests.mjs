import { spawnSync } from "node:child_process";

const testUrl = process.env.TEST_DATABASE_URL;
const developmentUrl = process.env.DATABASE_URL;

function fail(message) {
  console.error(`Integration tests not run: ${message}`);
  process.exit(1);
}

if (!testUrl) {
  fail("set TEST_DATABASE_URL to a disposable PostgreSQL database URL.");
}

let parsed;
try {
  parsed = new URL(testUrl);
} catch {
  fail("TEST_DATABASE_URL is not a valid URL.");
}

if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
  fail("TEST_DATABASE_URL must use the PostgreSQL URL scheme.");
}

if (developmentUrl) {
  if (testUrl.trim() === developmentUrl.trim()) {
    fail("TEST_DATABASE_URL matches DATABASE_URL.");
  }
  try {
    const devParsed = new URL(developmentUrl);
    if (
      parsed.hostname.toLowerCase() === devParsed.hostname.toLowerCase() &&
      parsed.pathname.toLowerCase() === devParsed.pathname.toLowerCase()
    ) {
      fail("TEST_DATABASE_URL matches DATABASE_URL host and database.");
    }
  } catch {
    // String comparison above already handled invalid URL formats
  }
}

const unsafeText = `${parsed.hostname}${parsed.pathname}`.toLowerCase();
if (/(^|[-_])prod(uction)?($|[-_])|production|live|primary/.test(unsafeText)) {
  fail("TEST_DATABASE_URL appears to target a production database.");
}

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vitest", "run", "--config", "vitest.integration.config.ts"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testUrl,
      ORIGINAL_DATABASE_URL: developmentUrl ?? "",
      NODE_ENV: "test",
    },
  },
);

process.exit(result.status ?? 1);
