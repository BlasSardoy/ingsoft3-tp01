import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,             // tope de cada test: el free tier despierta lento
  expect: { timeout: 15_000 }, // tope de cada aserción (default 5 s)
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",  // el FRONT
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  retries: 1,                  // absorbe una demora suelta; si pasa recién ahí, sale "flaky"
  reporter: [["html", { open: "never" }], ["list"]],
});
