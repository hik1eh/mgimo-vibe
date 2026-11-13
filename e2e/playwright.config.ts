import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["json", { outputFile: "/artifacts/results.json" }]],
  outputDir: "/artifacts/test-results",
  use: {
    actionTimeout: 15000,
    navigationTimeout: 20000,
    baseURL: process.env.BASE_URL || "http://web:8000",
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "off",
    video: "off",
    screenshot: "only-on-failure",
    reducedMotion: "reduce",
  },
});
