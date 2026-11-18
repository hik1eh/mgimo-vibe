import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow, settled, scrub } from "./helpers";

for (const width of [360, 390, 768, 1440]) {
  test(`responsive screens and automated accessibility at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error(scrub(e.message));
    });
    await login(page);
    for (const path of [
      "/today",
      "/requests",
      "/requests/new",
      "/schedule?view=week",
      "/academic-results",
      "/notifications",
      "/profile",
      "/announcements",
    ]) {
      await page.goto(path);
      await settled(page);
      await page.waitForLoadState("networkidle");
      await noOverflow(page);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.map((n) => n.target),
        })),
        path,
      ).toEqual([]);
      await page.screenshot({
        path: `/artifacts/after/${width}-${path.split("?")[0].replaceAll("/", "_")}.png`,
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await login(page, "staff.a");
    for (const path of [
      "/requests",
      "/staff/schedule",
      "/staff/announcements",
      "/staff/announcements/new",
      "/profile",
    ]) {
      await page.goto(path);
      await settled(page);
      await page.waitForLoadState("networkidle");
      await noOverflow(page);
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
        path,
      ).toEqual([]);
      await page.screenshot({
        path: `/artifacts/after/staff-${width}-${path.replaceAll("/", "_")}.png`,
        fullPage: true,
      });
    }
    expect(errors).toEqual([]);
  });
}

test("keyboard feed controls, visible focus, empty day and semester", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await login(page);
  const skip = page.getByRole("link", { name: "К содержимому" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const feed = page.locator(".news-mobile");
  await feed.focus();
  expect(
    await feed.evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => feed.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(10);
  await page
    .getByRole("button", { name: "Предыдущее объявление", exact: true })
    .click();
  await expect
    .poll(() => feed.evaluate((el) => el.scrollLeft))
    .toBeLessThanOrEqual(8);
  const total = await page.locator(".news-tile").count();
  await feed.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".news-counter")).toHaveText(`${total} / ${total}`);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".news-counter")).toHaveText(`1 / ${total}`);
  const bounds = (await feed.boundingBox())!;
  const touch = await page.context().newCDPSession(page);
  await touch.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  const x = bounds.x + bounds.width - 24,
    y = bounds.y + 100;
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let i = 1; i <= 8; i++)
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x - i * 28, y }],
    });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => feed.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(10);
  await touch.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await touch.detach();
  await expect(page.locator(".news-counter")).not.toHaveText(`1 / ${total}`);
  await page.goto("/schedule?view=day&date=2026-11-15");
  await expect(
    page.getByRole("heading", { name: "Нет занятий", exact: true }),
  ).toBeVisible();
  await page.goto("/academic-results");
  await expect(
    page.getByText("Закрыто", { exact: false }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Ожидается результат", { exact: true }).last(),
  ).toBeVisible();
  await page.getByLabel("Семестр", { exact: true }).selectOption("2");
  await expect(
    page.getByRole("heading", { name: "Предстоящих зачётов нет" }),
  ).toBeVisible();
  await page.goto("/academic-results?semester=9");
  await expect(
    page.getByRole("heading", { name: "Результатов за этот семестр нет" }),
  ).toBeVisible();
});
