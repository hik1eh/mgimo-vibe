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
    const fullShell = await page.locator(".auth-shell").boundingBox();
    expect(fullShell!.x).toBe(0);
    expect(fullShell!.y).toBe(0);
    expect(fullShell!.width).toBe(width);
    await expect(page.locator(".auth-carousel button")).toHaveCount(0);
    await expect(page.locator(".auth-motion-toggle")).toHaveCount(0);
    await expect(
      page.getByText("Ближе к знаниям.", { exact: false }),
    ).toHaveCount(0);
    const fonts = await page.evaluate(async () => {
      const heading = await document.fonts.load(
        '600 24px "Manrope"',
        "С возвращением",
      );
      const body = await document.fonts.load(
        '400 16px "Manrope"',
        "Логин Пароль",
      );
      return { heading: heading.length, body: body.length };
    });
    expect(fonts.heading).toBeGreaterThan(0);
    expect(fonts.body).toBeGreaterThan(0);
    await expect(page.locator(".auth-portrait-label")).toHaveCount(0);
    expect(
      await page
        .locator("h1")
        .evaluate((node) => getComputedStyle(node).fontFamily),
    ).toBe(
      await page
        .locator('input[name="username"]')
        .evaluate((node) => getComputedStyle(node).fontFamily),
    );
    const footer = await page.locator(".auth-panel-bottom").boundingBox();
    expect(footer!.y).toBeGreaterThan(900);
    expect(
      await page
        .locator(".auth-panel-bottom")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
    ).toBeLessThan(12);
    if (width < 1000) {
      await expect(page.locator(".auth-scene")).toHaveCount(0);
      await expect(page.locator("canvas")).toHaveCount(0);
      expect(
        requested.filter(
          (url) =>
            /\/campus-.*\.webp/.test(url) ||
            url.includes("/graduation-cap") ||
            url.includes("/Allura"),
        ),
      ).toHaveLength(0);
    } else {
      await expect(page.locator("canvas[data-graduation-cap]")).toBeVisible();
      const shell = await page.locator(".auth-shell").boundingBox();
      const panel = await page.locator(".auth-panel").boundingBox();
      expect(panel!.width / shell!.width).toBeCloseTo(0.35, 2);
      const scene = await page.locator(".auth-scene").boundingBox();
      const stream = await page.locator(".auth-photo-stage").boundingBox();
      expect(scene!.x).toBe(0);
      expect(stream!.y).toBe(0);
      expect(stream!.height).toBeCloseTo(scene!.height, 0);
      const lettering = page.locator(".auth-script");
      await expect(lettering).toHaveAttribute("aria-hidden", "true");
      expect(await lettering.locator("span").allTextContents()).toEqual([
        "University",
        "North",
        "Campus",
      ]);
      expect(
        await page.evaluate(
          async () =>
            (await document.fonts.load('400 130px "Allura"', "University"))
              .length,
        ),
      ).toBeGreaterThan(0);
      const decoration = await lettering.evaluate((node) => {
        const style = getComputedStyle(node);
        const initials = [...node.children].map((word) => {
          const range = document.createRange();
          range.setStart(word.firstChild!, 0);
          range.setEnd(word.firstChild!, 1);
          return range.getBoundingClientRect().toJSON();
        });
        return {
          font: style.fontFamily,
          size: parseFloat(style.fontSize),
          opacity: style.opacity,
          pointer: style.pointerEvents,
          selection: style.userSelect,
          color: style.color,
          animation: style.animationName,
          angle:
            (Math.atan2(
              new DOMMatrix(style.transform).b,
              new DOMMatrix(style.transform).a,
            ) *
              180) /
            Math.PI,
          initials,
        };
      });
      expect(decoration.font).toContain("Allura");
      expect(decoration.size).toBeGreaterThanOrEqual(130);
      expect(decoration.size).toBeLessThanOrEqual(190);
      expect(decoration.opacity).toBe("0.2");
      expect(decoration.pointer).toBe("none");
      expect(decoration.selection).toBe("none");
      expect(decoration.color).toBe("rgb(255, 255, 255)");
      expect(decoration.animation).toBe("none");
      expect(decoration.angle).toBeCloseTo(-9, 0);
      for (const initial of decoration.initials) {
        expect(initial.left).toBeGreaterThanOrEqual(0);
        expect(initial.right).toBeLessThan(stream!.x);
      }
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
  const beam = page.locator(".auth-lights > span").first();
  await expect(beam).toHaveCSS("opacity", "0.5");
  const loginTransform = await beam.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  await page.screenshot({
    path: "/artifacts/after/auth-focus-login-1440.png",
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  const password = page.getByLabel("Пароль", { exact: true });
  await expect(password).toBeFocused();
  await password.fill("not-a-real-demo-password");
  await expect(page.locator(".auth-login-content")).toHaveAttribute(
    "data-active-field",
    "password",
  );
  expect(
    await beam.evaluate((node) => getComputedStyle(node).transform),
  ).not.toBe(loginTransform);
  await page.screenshot({
    path: "/artifacts/after/auth-focus-password-1440.png",
    fullPage: true,
  });
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
  expect(
    await beam.evaluate((node) => getComputedStyle(node, "::after").opacity),
  ).toBe("1");
  expect(
    await beam.evaluate(
      (node) => getComputedStyle(node, "::after").backgroundColor,
    ),
  ).not.toBe(
    await beam.evaluate((node) => getComputedStyle(node).backgroundColor),
  );
  await page.screenshot({
    path: "/artifacts/after/auth-error-1440.png",
    fullPage: true,
  });
});

test("auth motion has no pause control, continues on hover and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  observeErrors(page, errors);
  await page.goto("/");
  const canvas = page.locator("canvas[data-graduation-cap]");
  await expect(canvas).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .locator(".auth-shell")
      .evaluate((node) =>
        node
          .getAnimations()
          .every((animation) =>
            (animation.effect?.getKeyframes() ?? []).every(
              (frame) => !("transform" in frame),
            ),
          ),
      ),
  ).toBe(true);
  await page.waitForTimeout(2600);
  const before = await canvas.screenshot();
  const region = await page.locator(".auth-photo-stage").boundingBox();
  await page.mouse.move(
    region!.x + region!.width / 2,
    region!.y + region!.height / 2,
  );
  await page.waitForTimeout(400);
  await expect(page.locator(".auth-scene")).toHaveAttribute(
    "data-running",
    "true",
  );
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  const card = page.locator(".auth-photo-card").nth(2);
  const previousTransform = await card.evaluate(
    (node) => getComputedStyle(node).transform,
  );
  await page.waitForTimeout(300);
  expect(
    await card.evaluate((node) => getComputedStyle(node).transform),
  ).not.toBe(previousTransform);
  await expect(page.locator(".auth-motion-toggle")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".auth-scene")).toHaveAttribute(
    "data-running",
    "false",
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const paused = await canvas.screenshot();
  await page.waitForTimeout(400);
  expect((await canvas.screenshot()).equals(paused)).toBe(true);
  expect(
    await card.evaluate((node) => getComputedStyle(node).animationName),
  ).toBe("none");
  await page.screenshot({
    path: "/artifacts/after/auth-motion-1440.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".auth-scene")).toHaveAttribute(
    "data-running",
    "true",
  );
  await expect(page.locator(".auth-carousel button")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("all seven campus photos cycle through four persistent slots", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  const loaded = new Set<string>();
  const errors: string[] = [];
  observeErrors(page, errors);
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.includes("/campus-") && path.endsWith(".webp") && response.ok())
      loaded.add(path);
  });
  await page.goto("/");
  const cards = page.locator(".auth-photo-card");
  await expect(cards).toHaveCount(4);
  await expect.poll(() => loaded.size).toBe(7);
  const result = await cards.evaluateAll(async (original) => {
    const stage = original[0].parentElement!;
    const seen = new Set<string>();
    let complete = false;
    const collect = () => {
      for (const image of stage.querySelectorAll("img"))
        seen.add(image.getAttribute("src")!);
      complete = seen.size === 7;
    };
    const observer = new MutationObserver(collect);
    observer.observe(stage, {
      attributes: true,
      subtree: true,
      attributeFilter: ["src"],
    });
    collect();
    for (const card of original)
      for (const animation of card.getAnimations())
        animation.updatePlaybackRate(12);
    const started = performance.now();
    while (!complete && performance.now() - started < 6000)
      await new Promise((resolve) => setTimeout(resolve, 50));
    observer.disconnect();
    return {
      photos: seen.size,
      slots: stage.querySelectorAll("figure").length,
      persistent: original.every(
        (card) => card.isConnected && card.parentElement === stage,
      ),
    };
  });
  expect(result).toEqual({ photos: 7, slots: 4, persistent: true });
  expect(errors).toEqual([]);
});

test("photo stream keeps complete images and generous gaps throughout its cycle", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".auth-photo-card img").first()).toBeVisible();
  await page.waitForTimeout(600);
  await page.locator(".auth-photo-card").evaluateAll((cards) => {
    for (const card of cards)
      for (const animation of card.getAnimations()) animation.pause();
  });
  for (const elapsed of [0, 1800, 3600, 5400, 7200, 9000, 10800, 12600]) {
    const metrics = await page
      .locator(".auth-photo-card")
      .evaluateAll((cards, time) => {
        for (const card of cards)
          for (const animation of card.getAnimations())
            animation.currentTime = time;
        const scene = document
          .querySelector(".auth-scene")!
          .getBoundingClientRect();
        const complete = cards.filter((card) => {
          const box = card.getBoundingClientRect();
          return (
            getComputedStyle(card).opacity !== "0" &&
            box.top >= scene.top &&
            box.bottom <= scene.bottom &&
            box.left >= scene.left &&
            box.right <= scene.right
          );
        }).length;
        const visible = cards
          .filter((card) => parseFloat(getComputedStyle(card).opacity) > 0.1)
          .map((card) => card.getBoundingClientRect())
          .filter((box) => box.bottom > scene.top && box.top < scene.bottom)
          .sort((a, b) => a.top - b.top);
        return {
          complete,
          gaps: visible
            .slice(1)
            .map((box, index) => box.top - visible[index].bottom),
        };
      }, elapsed);
    expect(
      metrics.complete,
      `No complete photo at ${elapsed} ms`,
    ).toBeGreaterThan(0);
    for (const gap of metrics.gaps)
      expect(gap, `Narrow photo gap at ${elapsed} ms`).toBeGreaterThanOrEqual(
        32,
      );
    if (elapsed % 3600 === 0)
      await page.screenshot({
        path: `/artifacts/after/auth-flow-${elapsed}.png`,
        fullPage: true,
      });
  }
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
  await expect
    .poll(() =>
      page
        .locator("[data-fallback=true] img")
        .evaluate((node) => (node as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("button", { name: "Войти в кабинет" }),
  ).toBeEnabled();
  await noOverflow(page);
  await page.screenshot({
    path: "/artifacts/after/auth-cap-fallback-1440.png",
    fullPage: true,
  });
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
