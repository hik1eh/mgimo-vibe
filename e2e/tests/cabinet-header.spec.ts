import { test, expect } from "@playwright/test";
import { login, noOverflow } from "./helpers";

const sections = [
  ["/today", "Сегодня", "campus"],
  ["/schedule", "Расписание", "atrium"],
  ["/academic-results", "Оценки", "record"],
  ["/requests", "Заявки", "letter"],
  ["/notifications", "Уведомления", "bell"],
  ["/profile", "Профиль", "clip"],
] as const;

for (const width of [360, 768, 1440, 1916]) {
  test(`section models and cabinet navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await login(page);
    await page.evaluate(() => (document.body.dataset.sameDocument = "yes"));
    for (const [path, title, model] of sections) {
      const tab = page.locator(`header a[href="${path}"]`).last();
      await tab.click();
      await expect(page.locator("main h1")).toHaveText(title);
      await expect(tab).toHaveAttribute("aria-current", "page");
      const hero = page.locator(".campus-banner .campus-object");
      await expect(hero).toHaveAttribute("data-campus-model", model);
      const fallback = hero.locator("img");
      await expect(fallback).toHaveAttribute(
        "src",
        `/assets/campus-models/${model}.webp`,
      );
      await expect
        .poll(() =>
          fallback.evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBe(900);
      await noOverflow(page);
    }
    await expect(page.locator("body")).toHaveAttribute(
      "data-same-document",
      "yes",
    );
    await page.goBack();
    await expect(page.locator("main h1")).toHaveText("Уведомления");
    await page.reload();
    await expect(page.locator("main h1")).toHaveText("Уведомления");
    await page.getByRole("button", { name: "Выйти", exact: true }).click();
    await expect(page.getByLabel("Логин", { exact: true })).toBeVisible();
  });
}

test("without WebGL the original 3D frame and normal navigation remain available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.startsWith("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await login(page);
  const scene = page.locator(".campus-banner .campus-object");
  await expect(scene).toHaveAttribute("data-render", "static");
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect
    .poll(() =>
      scene
        .locator("img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBe(900);
  await page.locator('header nav a[href="/schedule"]').click();
  await expect(scene).toHaveAttribute("data-campus-model", "atrium");
  await expect(
    page.getByRole("button", { name: "Неделя", exact: true }),
  ).toBeVisible();
});
