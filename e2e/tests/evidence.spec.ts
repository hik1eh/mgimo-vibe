import { test, expect } from "@playwright/test";
import { login, noOverflow } from "./helpers";

test("capture populated staff queue and the demo morning lesson", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, "staff.a");
  await expect(page.locator(".staff-queue-table")).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: "/artifacts/after/staff-queue-1440.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await login(page);
  // Explicitly simulated time for the visual specimen; server records are unchanged.
  await page.clock.setSystemTime(new Date("2026-11-13T08:00:00+03:00"));
  await page.goto("/today");
  await page.locator(".home-study .lesson-time").waitFor();
  await page.screenshot({
    path: "/artifacts/after/demo-morning-1440.png",
    fullPage: true,
  });
});
