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
        "/schedule?view=week",
        "/academic-results",
        "/notifications",
        "/profile",
      ]) {
        await page.goto(path);
        await expect(page.locator("main h1")).toBeVisible();
        await page.waitForLoadState("networkidle");
        await noOverflow(page);
      }
      await page.goto("/requests/new");
      const purpose = `${name} совместимость ${Date.now()}`;
      await page.getByLabel("Место предъявления").fill(purpose);
      await page
        .getByRole("button", { name: "Отправить заявку", exact: true })
        .click();
      await expect(page).toHaveURL(/\/requests\/\d+$/);
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
