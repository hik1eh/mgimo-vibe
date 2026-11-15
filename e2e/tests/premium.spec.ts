import { test, expect } from "@playwright/test";
import { login, noOverflow } from "./helpers";

test("photo reveal waits for loading; pointer feedback, keyboard and reduced motion remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/facade-*.webp", async (route) => {
    await gate;
    await route.continue();
  });
  await login(page);
  const photo = page.locator(".section-banner__photo");
  await expect(photo).not.toHaveAttribute("data-loaded", "true");
  await expect(page.locator("main h1")).toHaveText("Сегодня");
  release();
  await expect(photo).toHaveAttribute("data-loaded", "true");
  const transition = await photo.evaluate((el) => ({
    properties: getComputedStyle(el).transitionProperty,
    duration: getComputedStyle(el).transitionDuration,
  }));
  expect(transition.properties).toBe("opacity, transform");
  const duration = Number.parseFloat(transition.duration);
  expect(duration).toBeGreaterThan(0);
  expect(duration).toBeLessThanOrEqual(0.3);
  await expect
    .poll(() => photo.evaluate((el) => getComputedStyle(el).opacity))
    .toBe("1");
  const tab = page.locator('header nav a[href="/schedule"]');
  await tab.hover();
  await expect
    .poll(() => tab.evaluate((el) => getComputedStyle(el, "::before").opacity))
    .toBe("1");
  await tab.click();
  await expect(page.locator("main h1")).toHaveText("Расписание");
  await page.locator('header nav a[href="/academic-results"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".cabinet-app")).toHaveAttribute(
    "data-input",
    "keyboard",
  );
  await expect(page.locator("main h1")).toHaveText("Оценки");
  await expect(page.locator(".section-banner__photo")).toHaveAttribute(
    "data-loaded",
    "true",
  );
  expect(
    await page
      .locator(".section-banner__photo")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
  ).toBe("0s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('header nav a[href="/requests"]').click();
  await expect(page.locator("main h1")).toHaveText("Заявки");
  const reduced = page.locator(".section-banner__photo");
  await expect(reduced).toHaveAttribute("data-loaded", "true");
  expect(
    await reduced.evaluate((el) => ({
      duration: getComputedStyle(el).transitionDuration,
      transform: getComputedStyle(el).transform,
    })),
  ).toEqual({ duration: "0s", transform: "none" });
});

test("premium surfaces apply to cabinet routes while login stays separate", async ({
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
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page
        .locator(".cabinet-app")
        .evaluate((el) => getComputedStyle(el).backgroundImage),
    ).toContain("premium-surface-");
    expect(
      await page
        .locator(".cabinet-app")
        .evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("Manrope");
  }
  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page.getByLabel("Логин", { exact: true })).toBeVisible();
  await expect(page.locator(".cabinet-app")).toHaveCount(0);
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
