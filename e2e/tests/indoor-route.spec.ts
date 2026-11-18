import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, noOverflow } from "./helpers";

test.use({
  launchOptions: {
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  },
});

async function openRoute(page: Page) {
  await login(page);
  const context = await (await page.request.get("/api/v1/study-context")).json();
  const rows = await (await page.request.get(`/api/v1/schedule?start=${context.demo_day}`)).json();
  const lesson = rows.find((item: { room: string; status: string }) => item.room === "412" && item.status === "moved");
  expect(lesson).toBeDefined();
  await page.goto(`/schedule/${lesson.id}`);
  await page.getByRole("link", { name: "Показать маршрут", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Маршрут до аудитории", exact: true })).toBeVisible();
  return lesson;
}

for (const width of [360, 1440]) {
  test(`indoor WebGL route opens all four floors at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 360 ? 840 : 1000 });
    await openRoute(page);
    const stage = page.locator(".indoor-stage");
    const canvas = stage.locator("canvas");
    const floors = page.getByRole("group", { name: "Выбор этажа" });
    await expect(floors.getByRole("button")).toHaveCount(4);
    await expect(floors.getByRole("button", { name: "1-й этаж" })).toHaveAttribute("aria-pressed", "true");
    await expect(stage).toHaveAttribute("data-render", "ready");
    await expect(canvas).toHaveAttribute("data-indoor-floor", "1");
    await expect(canvas).toHaveAttribute("data-route-points", "4");
    expect(await canvas.evaluate((element: HTMLCanvasElement) => Boolean(element.getContext("webgl2")))).toBe(true);
    await expect(stage.locator('[data-kind="start"]')).toHaveText("Вход");
    await expect(stage.locator('[data-kind="end"]')).toHaveText("Лифт");
    await noOverflow(page);
    await page.screenshot({ path: `/artifacts/indoor-route/entrance-${width}.png`, fullPage: true });

    await floors.getByRole("button", { name: "2-й этаж" }).click();
    await expect(canvas).toHaveAttribute("data-indoor-floor", "2");
    await expect(canvas).toHaveAttribute("data-route-points", "0");
    await expect(page.getByText("На этом этаже выходить не нужно.", { exact: false })).toBeVisible();
    await floors.getByRole("button", { name: "3-й этаж" }).press("Enter");
    await expect(canvas).toHaveAttribute("data-indoor-floor", "3");
    await expect(stage.locator('[data-kind="start"]')).toHaveText("Лифт");
    if (width === 1440) {
      await page.screenshot({ path: "/artifacts/indoor-route/transit-1440.png", fullPage: true });
    }

    await page.getByRole("button", { name: /Подняться на 4-й этаж/ }).click();
    await expect(floors.getByRole("button", { name: "4-й этаж" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas).toHaveAttribute("data-indoor-floor", "4");
    await expect(canvas).toHaveAttribute("data-route-points", "4");
    await expect(stage.locator('[data-kind="end"]')).toHaveText("412");
    await expect(page.locator(".indoor-instruction")).toContainText("поверните налево");
    const scan = await new AxeBuilder({ page }).include(".route-layout")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(scan.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map((node) => node.target) }))).toEqual([]);
    await noOverflow(page);
    await page.screenshot({ path: `/artifacts/indoor-route/room-412-${width}.png`, fullPage: true });

    const first = await canvas.screenshot();
    await page.getByRole("button", { name: "Повернуть модель вправо" }).click();
    await expect(canvas).toHaveAttribute("data-angle", "0.230");
    const rotated = await canvas.screenshot();
    expect(first.equals(rotated)).toBe(false);
    if (width === 1440) {
      await page.screenshot({ path: "/artifacts/indoor-route/room-412-turn-1440.png", fullPage: true });
    }
    await page.getByRole("button", { name: "До лифта", exact: false }).click();
    await expect(canvas).toHaveAttribute("data-indoor-floor", "1");
    await page.getByRole("link", { name: "К занятию" }).click();
    await expect(page.locator(".room-number")).toHaveText("412");
  });
}

test("floor instructions work when the browser has no WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (kind: string, ...args: unknown[]) {
        return kind.startsWith("webgl") ? null : original.apply(this, [kind, ...args] as any);
      },
    });
  });
  await openRoute(page);
  await expect(page.locator(".indoor-stage")).toHaveAttribute("data-render", "unavailable");
  await expect(page.locator(".indoor-stage").getByRole("status")).toContainText("Следуйте подсказке");
  await page.getByRole("button", { name: "4-й этаж", exact: true }).click();
  await expect(page.locator(".indoor-instruction")).toContainText("поверните налево");
  await expect(page.getByText("Аудитория 412", { exact: true })).toBeVisible();
  await expect(page.locator(".indoor-stage canvas")).toHaveCount(0);
});
