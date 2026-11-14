import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { noOverflow } from "./helpers";
import type { Page } from "@playwright/test";

function observeErrors(page: Page, errors: string[]) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource:")
    )
      errors.push(message.text());
  });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    // A fresh anonymous page intentionally gets 401 from /me before showing login.
    if (
      response.status() >= 400 &&
      !(response.status() === 401 && path === "/api/v1/me")
    ) {
      errors.push(`HTTP ${response.status()}: ${path}`);
    }
  });
}

// Exercise real WebGL in headless Linux using the browser's software GPU.
test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  },
});

for (const width of [360, 390, 768, 1000, 1440]) {
  test(`auth layout, a11y and mobile asset budget at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [],
      requested: string[] = [];
    observeErrors(page, errors);
    page.on("request", (request) => requested.push(request.url()));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "С возвращением." }),
    ).toBeVisible();
    await noOverflow(page);
    if (width < 1000) {
      await expect(page.locator(".auth-scene")).toHaveCount(0);
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(
        requested.filter(
          (url) => /\/campus-.*\.webp/.test(url) || url.includes("/type-face-"),
        ),
      ).toHaveLength(0);
    } else {
      await expect(page.locator("canvas[data-typeface]")).toBeVisible();
      const shell = await page.locator(".auth-shell").boundingBox();
      const panel = await page.locator(".auth-panel").boundingBox();
      expect(panel!.width / shell!.width).toBeCloseTo(0.35, 2);
      await expect
        .poll(() =>
          page
            .locator(".auth-photo-card img")
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        )
        .toBe(true);
      expect(
        await page.evaluate(() =>
          document
            .getAnimations()
            .some(
              (animation) =>
                animation.effect?.getTiming().iterations === Infinity &&
                animation.playState === "running",
            ),
        ),
      ).toBe(false);
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `/artifacts/after/auth-${width}.png`,
      fullPage: true,
    });
  });
}

test("auth fields, keyboard, light states, loading and error preserve input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.getByLabel("Логин", { exact: true }).fill("student.a");
  await expect(page.locator(".auth-login-content")).toHaveAttribute(
    "data-active-field",
    "login",
  );
  await page.keyboard.press("Tab");
  const password = page.getByLabel("Пароль", { exact: true });
  await expect(password).toBeFocused();
  await password.fill("not-a-real-demo-password");
  await expect(page.locator(".auth-login-content")).toHaveAttribute(
    "data-active-field",
    "password",
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Показать пароль", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "text");
  await expect(
    page.getByRole("button", { name: "Скрыть пароль" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(password).toHaveAttribute("type", "password");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/auth/login", async (route) => {
    await gate;
    await route.fulfill({
      status: 401,
      json: { detail: "Неверный логин или пароль." },
    });
  });
  await page.getByRole("button", { name: "Войти в кабинет" }).click();
  await expect(page.getByRole("button", { name: "Входим…" })).toBeDisabled();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");
  release();
  await expect(page.getByRole("alert")).toContainText(
    "Неверный логин или пароль",
  );
  await expect(password).toHaveValue("not-a-real-demo-password");
  await expect(page.locator(".auth-login-content")).toHaveAttribute(
    "data-error",
    "true",
  );
  await page.screenshot({
    path: "/artifacts/after/auth-error-1440.png",
    fullPage: true,
  });
});

test("auth motion moves, pauses in place, resumes and supports photo selection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  observeErrors(page, errors);
  await page.goto("/");
  const canvas = page.locator("canvas[data-typeface]");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(2600);
  const before = await canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  await page
    .getByRole("button", { name: "Приостановить анимацию сцены" })
    .click();
  await expect(page.locator(".auth-scene")).toHaveAttribute(
    "data-running",
    "false",
  );
  const paused = await canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await canvas.screenshot()).equals(paused)).toBe(true);
  expect(
    await page
      .locator(".auth-photo-card")
      .first()
      .evaluate((card) => getComputedStyle(card).animationPlayState),
  ).toBe("paused");
  await page.screenshot({
    path: "/artifacts/after/auth-motion-1440.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Продолжить анимацию сцены" }).click();
  await expect(page.locator(".auth-scene")).toHaveAttribute(
    "data-running",
    "true",
  );
  await page
    .getByRole("button", { name: "Показать фото: Университетская библиотека" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Показать фото: Университетская библиотека",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Показать фото: Главный атриум" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(errors).toEqual([]);
});

test("auth remains usable without WebGL", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (kind: string, ...args: unknown[]) {
        if (kind.startsWith("webgl")) return null;
        return original.apply(this, [kind, ...args] as any);
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("[data-fallback=true]")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Войти в кабинет" }),
  ).toBeEnabled();
  await noOverflow(page);
});

test("auth at 200 percent text is readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await expect(
    page.getByRole("button", { name: "Войти в кабинет" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: "/artifacts/after/auth-large-text-360.png",
    fullPage: true,
  });
});
