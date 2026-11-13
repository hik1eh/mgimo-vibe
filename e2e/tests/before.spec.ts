import { test } from "@playwright/test";
import { login, settled } from "./helpers";
test("before T06: preserve actual desktop and mobile views", async ({
  page,
}) => {
  await login(page);
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await settled(page);
    await page.locator(".announcement-card").first().waitFor();
    await page.screenshot({
      path: `/artifacts/before/home-${width}.png`,
      fullPage: true,
    });
  }
});
