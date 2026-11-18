import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow } from "./helpers";

const screenshots = "/artifacts/campus-polish";

test("news cards move between slots and a seen schedule change stops pulsing", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const captured: { id: string; from: string }[] = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (keyframes, options) {
      if (this instanceof HTMLElement && this.dataset.slideId && Array.isArray(keyframes)) {
        captured.push({ id: this.dataset.slideId, from: String(keyframes[0]?.transform) });
        document.documentElement.dataset.newsMoves = JSON.stringify(captured);
      }
      return animate.call(this, keyframes, options);
    };
  });
  await login(page);
  const { today } = await (await page.request.get("/api/v1/study-context")).json();
  await page.clock.setFixedTime(new Date(`${today}T05:00:00Z`));
  await page.goto("/today");
  const tile = page.locator('.news-tile[data-move-pending="true"]');
  const lesson = page.locator('.home-study[data-move-pending="true"]');
  await expect(tile).toBeVisible();
  await expect(lesson).toBeVisible();
  await expect(page.locator(".today-dashboard")).not.toContainText("Учебные даты демонстрационные");
  await expect.poll(() => tile.evaluate((node) =>
    getComputedStyle(node, "::after").animationName)).toBe("move-attention");
  await page.screenshot({ path: `${screenshots}/today-1440.png`, fullPage: true });

  const center = page.locator('.news-tile[data-active="true"]');
  const previous = await center.getAttribute("data-news-id");
  const next = page.getByRole("button", { name: "Следующее объявление" });
  await next.click();
  await expect(center).not.toHaveAttribute("data-news-id", previous!);
  const frames = JSON.parse((await page.locator("html").getAttribute("data-news-moves")) ?? "[]");
  expect(frames.length).toBeGreaterThan(3);
  expect(frames.filter(({ from }: { from: string }) => /^translate\([1-9]/.test(from)).length).toBeGreaterThan(2);
  await page.getByRole("button", { name: "Предыдущее объявление" }).click();
  await expect(center).toHaveAttribute("data-news-id", previous!);
  await expect(page.locator(".news-tile-exit")).toHaveCount(0);
  await tile.hover();
  await expect(page.locator("[data-move-pending]")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(`.news-tile[data-news-id="${previous}"]`)).toBeVisible();
  await expect(page.locator("[data-move-pending]")).toHaveCount(0);
  await noOverflow(page);
});

for (const width of [360, 1440]) {
  test(`student badge and all nine details at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 940 });
    if (width > 640) await page.emulateMedia({ reducedMotion: "no-preference" });
    await login(page);
    await page.goto("/profile");
    const heading = page.getByRole("heading", { name: "Информация о студенте", exact: true });
    const badge = page.locator(".badge-column");
    const host = page.locator(".student-badge-layout");
    const toggle = page.getByRole("button", { name: "Данные студента" });
    const details = page.locator("#student-data");
    await expect(heading).toBeVisible();
    await expect(details).toBeHidden();
    const closed = (await badge.boundingBox())!;
    const grid = (await host.boundingBox())!;
    expect(Math.abs(closed.x + closed.width / 2 - grid.x - grid.width / 2)).toBeLessThan(2);
    await noOverflow(page);
    await page.screenshot({ path: `${screenshots}/profile-closed-${width}.png`, fullPage: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(details).toBeVisible();
    await expect(details.locator(".profile-study-fields dt")).toHaveText([
      "ФИО", "ВУЗ", "Курс", "Группа", "Возраст", "Логин", "Факультет",
      "Форма обучения", "№ студенческого",
    ]);
    await expect(details.getByText("СК-ОН-0201", { exact: true })).toBeVisible();
    if (width > 640) {
      await expect.poll(async () => (await badge.boundingBox())!.x).toBeLessThan(closed.x - 80);
      await badge.evaluate(async (node) => {
        await Promise.all(node.getAnimations().map((animation) => animation.finished));
      });
    } else {
      expect(Math.abs((await badge.boundingBox())!.x - closed.x)).toBeLessThan(2);
    }
    expect(await page.evaluate(() => {
      const nav = getComputedStyle(document.querySelector(".cabinet-header")!).backgroundColor;
      const banner = getComputedStyle(document.querySelector(".campus-banner")!);
      return banner.backgroundColor === nav && banner.backgroundImage === "none";
    })).toBe(true);
    await expect(page.locator(".cabinet-app > :last-child")).toHaveClass("cabinet-footer");
    await noOverflow(page);
    await page.screenshot({ path: `${screenshots}/profile-open-${width}.png`, fullPage: true });
    await toggle.press("Enter");
    await expect(details).toBeHidden();
  });
}

test("mobile tap acknowledges a move and the campus viewer fits a small screen", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL || "http://web:8000",
    viewport: { width: 360, height: 800 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await login(page);
    const alert = page.locator('.news-tile[data-move-pending="true"]');
    await expect(alert).toBeVisible();
    expect(await alert.evaluate((node) => getComputedStyle(node, "::after").animationName)).toBe("none");
    await alert.tap();
    const newsDialog = page.getByRole("dialog");
    await expect(newsDialog).toBeVisible();
    await expect(page.locator('.news-tile[data-move-pending="true"]')).toHaveCount(0);
    await newsDialog.getByRole("button", { name: "Закрыть объявление" }).tap();
    await page.getByRole("button", { name: "Кампус в 3D" }).tap();
    const dialog = page.getByRole("dialog", { name: "Северный кампус" });
    await dialog.getByRole("button", { name: "Внутренний двор" }).tap();
    await expect(dialog.locator('[data-campus-view="courtyard"]')).toBeVisible();
    await expect.poll(async () => (await dialog.boundingBox())!.width).toBeLessThan(361);
    await noOverflow(page);
    await page.screenshot({ path: `${screenshots}/campus-mobile.png`, fullPage: true });
  } finally {
    await context.close();
  }
});

test("campus inspection renders three camera angles with an accessible dialog", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  const trigger = page.getByRole("button", { name: "Кампус в 3D" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Северный кампус" });
  const canvas = dialog.locator("canvas[data-campus-canvas]");
  await expect(canvas).toHaveAttribute("data-yaw", "0.3800");
  await dialog.screenshot({ path: `${screenshots}/campus-entrance.png` });
  await dialog.getByRole("button", { name: "Учебные корпуса" }).click();
  await expect(canvas).toHaveAttribute("data-yaw", "1.2900");
  await dialog.screenshot({ path: `${screenshots}/campus-wing.png` });
  await dialog.getByRole("button", { name: "Внутренний двор" }).click();
  await expect(canvas).toHaveAttribute("data-yaw", "2.8900");
  await dialog.screenshot({ path: `${screenshots}/campus-courtyard.png` });
  const scan = await new AxeBuilder({ page }).include(".campus-view-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(scan.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
