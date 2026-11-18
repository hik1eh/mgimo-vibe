import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { login, noOverflow } from "./helpers";
import { lessons, mockRedesign } from "./redesign-fixtures";

test("all-groups controls keep real API authorization and foreign lesson denial", async ({
  page,
  browser,
}) => {
  await login(page);
  const study = await (await page.request.get("/api/v1/study-context")).json();
  const start = new Date(`${study.demo_day}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() || 7) + 1);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const range = new URLSearchParams({
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  });
  const ownLessons = await (
    await page.request.get(`/api/v1/schedule?${range}`)
  ).json();
  expect(ownLessons.length).toBeGreaterThan(0);
  const foreign = ownLessons[0];
  const otherContext = await browser.newContext({
    baseURL: process.env.BASE_URL,
  });
  try {
    const other = await otherContext.newPage();
    await login(other, "student.b");
    const allowed = await (
      await other.request.get(`/api/v1/schedule?${range}`)
    ).json();
    expect(allowed.length).toBeGreaterThan(0);
    expect(
      allowed.every(
        (row: { group_id: number }) => row.group_id !== foreign.group_id,
      ),
    ).toBe(true);
    const query = new URLSearchParams({
      view: "week",
      date: study.demo_day,
      group: "all",
    });
    await other.goto(`/schedule?${query}`);
    await expect(other.locator(".calendar-lesson")).toHaveCount(allowed.length);
    query.set("group", String(foreign.group_id));
    await other.goto(`/schedule?${query}`);
    await expect(
      other.getByRole("heading", { name: "Нет совпадений", exact: true }),
    ).toBeVisible();
    await expect(other.locator(".calendar-lesson")).toHaveCount(0);
    expect(
      (await other.request.get(`/api/v1/schedule/${foreign.id}`)).status(),
    ).toBe(404);
  } finally {
    await otherContext.close();
  }
});

test("five symmetric squares prioritize news, hover reserves space and details restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockRedesign(page);
  await login(page);
  const cards = page.locator(".news-tile");
  await expect(cards).toHaveCount(5);
  const active = page.locator(".news-tile[data-active]");
  await expect(active).toContainText("Изменена аудитория");
  await expect(active).toContainText("305 → 412");
  const before = await page.locator(".news-tile-shell").evaluateAll((nodes) =>
    nodes.map((node) => {
      const b = node.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }),
  );
  const bottom = await page
    .locator(".dean-feed")
    .evaluate((el) => el.getBoundingClientRect().bottom);
  await cards.first().hover();
  await expect
    .poll(() =>
      cards
        .first()
        .evaluate((el) =>
          Number.parseFloat(
            getComputedStyle(el.querySelector(".news-peek")!).opacity,
          ),
        ),
    )
    .toBe(1);
  expect(
    await page.locator(".news-tile-shell").evaluateAll((nodes) =>
      nodes.map((node) => {
        const b = node.getBoundingClientRect();
        return { x: b.x, y: b.y, w: b.width, h: b.height };
      }),
    ),
  ).toEqual(before);
  expect(
    await page
      .locator(".dean-feed")
      .evaluate((el) => el.getBoundingClientRect().bottom),
  ).toBe(bottom);
  await page
    .getByRole("button", { name: "Следующее объявление", exact: true })
    .click();
  await expect(page.locator(".news-counter")).toHaveText("2 / 7");
  const tile = page.locator(".news-tile[data-active]");
  await tile.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Полный текст объявления 2.", { exact: false }),
  ).toBeVisible();
  await expect
    .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
    .toBe(true);
  for (const key of ["Tab", "Tab", "Shift+Tab"]) {
    await page.keyboard.press(key);
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }
  const dialogScan = await new AxeBuilder({ page })
    .include(".news-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(dialogScan.violations.map((v) => v.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(tile).toBeFocused();
  await tile.press("Space");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Закрыть объявление" }).click();
  await expect(tile).toBeFocused();
  await noOverflow(page);
});

for (const count of [0, 1, 3, 7])
  test(`feed has ${count} unique records and appropriate controls`, async ({
    page,
  }) => {
    await mockRedesign(page, count);
    await login(page);
    await expect(page.locator(".news-tile")).toHaveCount(Math.min(count, 5));
    await expect(page.locator(".news-controls")).toHaveCount(count > 1 ? 1 : 0);
    if (!count)
      await expect(
        page.getByText("Новых объявлений нет.", { exact: true }),
      ).toBeVisible();
    const titles = await page.locator(".news-title").allTextContents();
    expect(new Set(titles).size).toBe(titles.length);
  });

test("day/week filters intersect by identity, survive reload and detail navigation, reset without changing period", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockRedesign(page);
  await login(page);
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await expect(page.locator(".calendar-lesson")).toHaveCount(4);
  const room = JSON.stringify(["room", "Северный корпус", "412"]),
    teacher = JSON.stringify(["teacher", "Елена Лазурная"]);
  await page.getByLabel("Группа", { exact: true }).selectOption("1");
  await page.getByLabel("Преподаватель", { exact: true }).selectOption(teacher);
  await page.getByLabel("Аудитория", { exact: true }).selectOption(room);
  await expect(page.locator(".calendar-lesson")).toHaveCount(1);
  await expect(page.locator(".calendar-lesson")).toContainText("Перенос");
  const query = new URL(page.url()).search;
  await page.reload();
  await expect(page.getByLabel("Аудитория", { exact: true })).toHaveValue(room);
  await page.locator(".calendar-lesson").click();
  await expect(page.locator(".room-number")).toHaveText("412");
  await page.getByRole("link", { name: "← К расписанию", exact: true }).click();
  expect(new URL(page.url()).search).toBe(query);
  await page.getByRole("button", { name: "День", exact: true }).click();
  await expect(page.locator(".day-agenda .schedule-row")).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-11-18");
  await page
    .getByLabel("Аудитория", { exact: true })
    .selectOption(JSON.stringify(["room", "Северный корпус", "305"]));
  await expect(
    page.getByRole("heading", { name: "Нет совпадений", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Сбросить фильтры", exact: true })
    .click();
  await expect(page.getByLabel("Группа", { exact: true })).toHaveValue("all");
  await expect(page.getByLabel("Преподаватель", { exact: true })).toHaveValue(
    "all",
  );
  await expect(page.locator(".day-agenda .schedule-row")).toHaveCount(3);
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-11-18");
  await page.getByRole("button", { name: "Неделя", exact: true }).click();
  await page
    .getByRole("button", { name: "Следующая неделя", exact: true })
    .click();
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-11-25");
  await page.getByRole("button", { name: "Сегодня", exact: true }).click();
  expect(new URL(page.url()).searchParams.get("view")).toBe("week");
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-11-18");
});

test("calendar keeps overlapping slots, cancellation and building-specific rooms accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await mockRedesign(page);
  await login(page);
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await expect(
    page.locator(".week-calendar tbody tr").first().locator(".calendar-lesson"),
  ).toHaveCount(2);
  await expect(
    page.locator('.calendar-lesson[data-status="cancelled"]'),
  ).toContainText("Отменено");
  await page
    .getByLabel("Аудитория", { exact: true })
    .selectOption(JSON.stringify(["room", "Южный корпус", "412"]));
  await expect(page.locator(".calendar-lesson")).toHaveCount(2);
  await page
    .locator(".calendar-lesson")
    .filter({ hasText: "Параллельный" })
    .click();
  await expect(page).toHaveURL(/\/schedule\/902\?/);
  await expect(
    page.getByRole("heading", { name: "Параллельный семинар", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Южный корпус", { exact: true })).toBeVisible();
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await page.locator('.calendar-lesson[data-status="cancelled"]').click();
  await expect(
    page.getByRole("heading", { name: "Занятие отменено", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /маршрут/i })).toHaveCount(0);
});

for (const width of [360, 390, 1024, 1440])
  test(`new controls and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await mockRedesign(page);
    await login(page);
    for (const path of [
      "/today",
      "/schedule?view=day&date=2026-11-18&group=all",
      "/schedule?view=week&date=2026-11-18&group=all",
    ]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await noOverflow(page);
      if (width === 1024 && path === "/today")
        await expect(page.locator(".news-tile")).toHaveCount(3);
      if (width < 900 && path.includes("week")) {
        await expect(page.locator(".week-agenda")).toBeVisible();
        await expect(page.locator(".week-calendar")).not.toBeVisible();
      }
      const scan = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        scan.violations.map((v) => ({
          id: v.id,
          targets: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
  });

test("mobile swipe updates position, tap opens the same detail and touch does not magnify cards", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL,
    viewport: { width: 360, height: 1000 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await mockRedesign(page);
    await login(page);
    await expect(page.locator(".news-tile")).toHaveCount(7);
    const feed = page.locator(".news-mobile");
    const box = (await feed.boundingBox())!;
    const touch = await context.newCDPSession(page);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: box.x + box.width - 35, y: box.y + 120 }],
    });
    for (let i = 1; i <= 8; i++)
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: box.x + box.width - 35 - i * 27, y: box.y + 120 }],
      });
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() => feed.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(100);
    await expect(page.locator(".news-counter")).not.toHaveText("1 / 7");
    const active = page.locator(".news-tile[data-active]");
    await active.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Закрыть объявление" }).tap();
    expect(await active.evaluate((el) => getComputedStyle(el).transform)).toBe(
      "none",
    );
    await feed.evaluate((el) =>
      el.scrollTo({ left: el.scrollWidth, behavior: "instant" }),
    );
    await expect(page.locator(".news-counter")).toHaveText("7 / 7");
    await page
      .getByRole("button", { name: "Следующее объявление", exact: true })
      .tap();
    await expect(page.locator(".news-counter")).toHaveText("1 / 7");
    await noOverflow(page);
    await touch.detach();
  } finally {
    await context.close();
  }
});

test("late responses do not replace a newer week or lose filters", async ({
  page,
}) => {
  await mockRedesign(page);
  await login(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/schedule?**", async (route) => {
    const start = new URL(route.request().url()).searchParams.get("start");
    if (start === "2026-11-23") await gate;
    await route.fulfill({
      json: [
        {
          ...lessons[0],
          subject: start === "2026-11-30" ? "Новая неделя" : "Старый ответ",
          starts_at: `${start}T09:00:00+03:00`,
          ends_at: `${start}T10:30:00+03:00`,
        },
      ],
    });
  });
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await page
    .getByRole("button", { name: "Следующая неделя", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Следующая неделя", exact: true })
    .click();
  await expect(page.locator(".calendar-lesson")).toContainText("Новая неделя");
  release();
  await page.waitForTimeout(150);
  await expect(page.locator(".calendar-lesson")).toContainText("Новая неделя");
});

test("calendar errors can be retried without losing period or filters", async ({
  page,
}) => {
  await mockRedesign(page);
  await login(page);
  let fail = true;
  await page.route("**/api/v1/schedule?**", async (route) => {
    if (fail)
      return route.fulfill({
        status: 503,
        json: { detail: "Временно недоступно" },
      });
    await route.fulfill({ json: lessons });
  });
  const room = JSON.stringify(["room", "Северный корпус", "412"]);
  const query = new URLSearchParams({
    view: "week",
    date: "2026-11-18",
    group: "all",
    room,
  });
  await page.goto(`/schedule?${query}`);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Аудитория", { exact: true })).toHaveValue(room);
  fail = false;
  await page.getByRole("button", { name: "Повторить", exact: true }).click();
  await expect(page.locator(".calendar-lesson")).toHaveCount(1);
  expect(new URL(page.url()).searchParams.get("date")).toBe("2026-11-18");
  expect(new URL(page.url()).searchParams.get("view")).toBe("week");
  await expect(page.getByLabel("Аудитория", { exact: true })).toHaveValue(room);
});

test("a selected group survives an empty week and a direct reload", async ({
  page,
}) => {
  await mockRedesign(page);
  await login(page);
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await page.getByLabel("Группа", { exact: true }).selectOption("2");
  await page
    .getByRole("button", { name: "Следующая неделя", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "На этой неделе занятий нет",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Группа", { exact: true })).toHaveValue("2");
  await page.reload();
  await expect(page.getByLabel("Группа", { exact: true })).toHaveValue("2");
  await page
    .getByRole("button", { name: "Предыдущая неделя", exact: true })
    .click();
  await expect(page.getByLabel("Группа", { exact: true })).toHaveValue("2");
  await expect(page.locator(".calendar-lesson")).toHaveCount(1);
  await page
    .getByRole("button", {
      name: "Открыть день: 18 ноября 2026 г.",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "День", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".day-agenda .schedule-row")).toHaveCount(1);
});

test("capture redesign evidence at rest, hover, filtered week and mobile day", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await mockRedesign(page);
  await login(page);
  await page.locator(".news-tile[data-active]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "/artifacts/student-redesign/today-1440-idle.png",
    fullPage: true,
    animations: "disabled",
  });
  const hoverMetrics = [];
  for (const [name, tile] of [
    ["left", page.locator(".news-tile").first()],
    ["right", page.locator(".news-tile").last()],
  ] as const) {
    await tile.hover();
    await expect
      .poll(() =>
        tile
          .locator(".news-peek")
          .evaluate((el) => getComputedStyle(el).opacity),
      )
      .toBe("1");
    await page.locator(".news-band").evaluate(async (el) => {
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    const bounds = await tile.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
    const overflow = await tile.evaluate(
      (el) => el.scrollHeight > el.clientHeight + 1,
    );
    expect(overflow).toBe(false);
    await page.screenshot({
      path: `/artifacts/student-redesign/today-1440-hover-${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
    hoverMetrics.push({
      name,
      cards: await page.locator(".news-tile").evaluateAll((nodes) =>
        nodes.map((el) => ({
          hover: el.matches(":hover"),
          focus: el.matches(":focus-visible"),
          transform: getComputedStyle(el).transform,
          peek: getComputedStyle(el.querySelector(".news-peek")!).opacity,
        })),
      ),
    });
  }
  await writeFile(
    "/artifacts/student-redesign/hover-metrics.json",
    JSON.stringify(hoverMetrics, null, 2),
  );
  await page.goto("/schedule?view=week&date=2026-11-18&group=all");
  await page
    .getByLabel("Преподаватель", { exact: true })
    .selectOption(JSON.stringify(["teacher", "Елена Лазурная"]));
  await page
    .getByLabel("Аудитория", { exact: true })
    .selectOption(JSON.stringify(["room", "Северный корпус", "412"]));
  await expect(page.locator(".calendar-lesson")).toHaveCount(1);
  await page.screenshot({
    path: "/artifacts/student-redesign/schedule-1440-filters.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto("/schedule?view=day&date=2026-11-18&group=all");
  await expect(page.locator(".day-agenda .schedule-row")).toHaveCount(3);
  await page.screenshot({
    path: "/artifacts/student-redesign/schedule-390-day.png",
    fullPage: true,
  });
  await page.goto("/today");
  await expect(page.locator(".news-tile")).toHaveCount(7);
  await page.screenshot({
    path: "/artifacts/student-redesign/today-390.png",
    fullPage: true,
  });
});
