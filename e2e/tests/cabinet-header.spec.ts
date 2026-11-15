import { test, expect } from "@playwright/test";
import { login, noOverflow, settled } from "./helpers";

const sections = [
  ["/today", "Сегодня", "facade-"],
  ["/schedule", "Расписание", "atrium-"],
  ["/academic-results", "Оценки", "library-"],
  ["/requests", "Заявки", "student-services-"],
] as const;

for (const width of [360, 768, 1440, 1916]) {
  test(`section photos and cabinet navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await login(page);
    // Client navigation must keep the document and logged-in session alive.
    const marker = await page.evaluate(() => {
      const value = Math.random().toString();
      (window as unknown as Record<string, string>).cabinetMarker = value;
      return value;
    });
    for (const [path, title, photo] of sections) {
      await page.locator(`header nav a[href="${path}"]`).click();
      await settled(page);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toHaveText(title);
      await expect(
        page.locator(`header nav a[href="${path}"]`),
      ).toHaveAttribute("aria-current", "page");
      const image = page.locator(".section-banner__photo");
      await expect(image).toHaveAttribute("src", new RegExp(photo));
      await expect
        .poll(() =>
          image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const resolution = await image.evaluate((img: HTMLImageElement) => ({
        source: img.naturalWidth,
        displayed: img.getBoundingClientRect().width,
      }));
      expect(
        resolution.source,
        "Banner must not enlarge a thumbnail",
      ).toBeGreaterThanOrEqual(Math.ceil(resolution.displayed));
      await noOverflow(page);
      await page.screenshot({
        path: `/artifacts/cabinet-header-compact/${width}-${path.slice(1)}.png`,
        fullPage: true,
      });
    }
    expect(
      await page.evaluate(
        () => (window as unknown as Record<string, string>).cabinetMarker,
      ),
    ).toBe(marker);
    await page.goBack();
    await expect(page.locator("main h1")).toHaveText("Оценки");
    await page.reload();
    await expect(page.locator("main h1")).toHaveText("Оценки");
    await expect(page.locator(".section-banner__photo")).toHaveAttribute(
      "src",
      /library-/,
    );
    await page.locator('header a[href="/notifications"]').click();
    await expect(page.locator(".section-banner")).toHaveCount(0);
    await expect(page.locator("main h1")).toHaveText("Уведомления");
    await page.locator('header a[href="/profile"]').click();
    await expect(page.locator("main h1")).toHaveText("Ваш профиль");
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(page.getByLabel("Логин", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("section photos retain enough pixels for a 1440px HiDPI display", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await login(page);
    for (const [path] of sections) {
      await page.locator(`header nav a[href="${path}"]`).click();
      const image = page.locator(".section-banner__photo");
      await expect
        .poll(() =>
          image.evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
          ),
        )
        .toBe(true);
      const pixels = await image.evaluate((img: HTMLImageElement) => ({
        available: img.naturalWidth,
        needed: Math.ceil(img.getBoundingClientRect().width * devicePixelRatio),
      }));
      expect(pixels.available, path).toBeGreaterThanOrEqual(pixels.needed);
      await page.screenshot({
        path: `/artifacts/cabinet-header-compact/hidpi-${path.slice(1)}.png`,
        clip: { x: 0, y: 0, width: 1440, height: 220 },
      });
    }
  } finally {
    await context.close();
  }
});
