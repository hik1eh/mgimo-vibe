import { test, expect } from "@playwright/test";
import { login, noOverflow } from "./helpers";

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  },
});

test("WebGL campus changes perspective and the scene survives period and filter changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await login(page);
  const model = page.locator(".campus-banner .campus-object");
  await expect(model).toHaveAttribute("data-render", "webgl");
  const canvas = model.locator("canvas");
  await expect(canvas).toHaveAttribute("data-yaw", "0.3600");
  expect(
    await canvas.evaluate((node: HTMLCanvasElement) =>
      Boolean(node.getContext("webgl2")),
    ),
  ).toBe(true);
  expect(Number(await canvas.getAttribute("data-meshes"))).toBeGreaterThan(5);
  const first = await canvas.screenshot({
    path: "/artifacts/final-mvp/screens/campus-angle-a.png",
  });
  const box = (await model.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.94, box.y + box.height * 0.5);
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-yaw")))
    .toBeGreaterThan(0.44);
  const second = await canvas.screenshot({
    path: "/artifacts/final-mvp/screens/campus-angle-b.png",
  });
  expect(second.equals(first)).toBe(false);

  const tab = page.locator('header nav a[href="/schedule"]');
  await tab.hover();
  await expect
    .poll(() => tab.evaluate((el) => getComputedStyle(el, "::before").opacity))
    .toBe("1");
  const nav = await page.locator("header nav").boundingBox();
  await canvas.evaluate((el) => el.setAttribute("data-reused", "true"));
  await tab.click();
  await expect(page.locator("main h1")).toHaveText("Расписание");
  await expect(model).toHaveAttribute("data-campus-model", "atrium");
  await expect(model).toHaveAttribute("data-render", "webgl");
  await expect(canvas).toHaveAttribute("data-reused", "true");
  await expect(canvas).toHaveAttribute("data-yaw", "0.3600");
  const title = page.locator(".campus-banner-title");
  await title.evaluate((el) => el.setAttribute("data-stable", "true"));
  await page.getByRole("button", { name: "Неделя", exact: true }).click();
  await page.getByLabel("Группа", { exact: true }).selectOption("all");
  await expect(title).toHaveAttribute("data-stable", "true");
  await expect(canvas).toHaveAttribute("data-yaw", "0.3600");
  expect(await page.locator("header nav").boundingBox()).toEqual(nav);

  await page.locator('header nav a[href="/academic-results"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("main h1")).toHaveText("Успеваемость");
  await expect(model).toHaveAttribute("data-render", "webgl");
  await expect(title).not.toHaveAttribute("data-enter", "true");
  expect(await canvas.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reducedBox = (await model.boundingBox())!;
  await page.mouse.move(reducedBox.x + 8, reducedBox.y + 15);
  await expect(canvas).toHaveAttribute("data-yaw", "0.3600");
});

test("main student sections share the campus palette and local Cyrillic headings", async ({
  page,
}) => {
  await login(page);
  for (const path of [
    "/today",
    "/schedule",
    "/academic-results",
    "/requests",
    "/notifications",
    "/profile",
  ]) {
    await page.goto(path);
    const heading = page.locator("main h1");
    await expect(heading).toBeVisible();
    await expect(heading).toHaveCount(1);
    expect(
      await heading.evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("Lora");
    await expect(page.locator("main h1")).toHaveCSS("font-style", "italic");
    expect(
      await page
        .locator(".cabinet-app")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(244, 246, 248)");
  }
  expect(
    await page.evaluate(() =>
      document.fonts
        .load('italic 550 70px "Lora"', "Сегодня Расписание Успеваемость Профиль")
        .then((fonts) => fonts.length),
    ),
  ).toBeGreaterThan(0);
});

test("populated lesson keeps its time on one line across cabinet widths", async ({
  page,
}) => {
  await login(page);
  const study = await (await page.request.get("/api/v1/study-context")).json();
  await page.route("**/api/v1/study-context", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      json: { ...(await response.json()), today: study.demo_day },
    });
  });
  await page.clock.setFixedTime(new Date(`${study.demo_day}T05:00:00Z`));
  for (const width of [360, 768, 1024, 1472]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/today");
    const time = page.locator(".home-study .lesson-time");
    await expect(time).toBeVisible();
    expect(
      await time.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el.firstChild!);
        return range.getClientRects().length;
      }),
    ).toBe(1);
    await noOverflow(page);
  }
});
