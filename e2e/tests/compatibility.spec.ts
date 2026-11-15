import { test, expect } from "@playwright/test";
import { webkit, firefox } from "playwright";
import { login, noOverflow } from "./helpers";

for (const [name, engine, width] of [
  ["WebKit", webkit, 360],
  ["Firefox", firefox, 1440],
] as const) {
  test(`${name} login, study screens and persisted request at ${width}px`, async () => {
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        viewport: { width, height: 1000 },
        locale: "ru-RU",
        timezoneId: "Europe/Moscow",
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await login(page);
      await page.waitForLoadState("networkidle");
      for (const path of [
        "/today",
        "/schedule",
        "/academic-results",
        "/notifications",
        "/profile",
      ]) {
        // Exercise the app's real navigation. Repeated full-document goto()
        // can abort unrelated fetches during WebKit document teardown.
        if (new URL(page.url()).pathname !== path)
          await page.locator(`header a[href="${path}"]`).last().click();
        if (path === "/schedule")
          await page
            .getByRole("button", { name: "Неделя", exact: true })
            .click();
        await expect(page.locator("main h1")).toBeVisible();
        await page.waitForLoadState("networkidle");
        await noOverflow(page);
      }
      await page.locator('header nav a[href="/requests"]').click();
      await page.getByRole("link", { name: /Заказать справку/ }).click();
      const purpose = `${name} совместимость ${Date.now()}`;
      await page.getByLabel("Место предъявления").fill(purpose);
      await page
        .getByRole("button", { name: "Отправить заявку", exact: true })
        .click();
      await expect(page).toHaveURL(/\/requests\/\d+$/);
      // Wait for the first detail fetch before exercising reload; a URL change
      // alone can interrupt that fetch in WebKit and report a page error.
      await expect(page.getByText(purpose, { exact: true })).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.reload();
      await expect(page.getByText(purpose, { exact: true })).toBeVisible();
      await page.screenshot({
        path: `/artifacts/after/${name.toLowerCase()}-${width}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    } finally {
      await browser.close();
    }
  });
}
